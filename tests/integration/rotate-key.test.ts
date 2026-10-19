import { randomBytes, randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { credentialAad, decrypt, encrypt, fromBytea, toBytea, type Key } from '@/lib/crypto';
import { rotateCredentials } from '@/lib/credentials-rotation';
import type { Database } from '@/lib/database.types';

// Rotación de clave (T17b) contra la base real: después de rotar, todo se descifra
// con la clave nueva y nada con la vieja.

const url = process.env.SUPABASE_TEST_URL!;
const admin = createClient<Database>(url, process.env.SUPABASE_TEST_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

// Versiones altas para no chocar con credenciales reales de la base local (v1).
const oldKey: Key = { version: 41, key: randomBytes(32) };
const newKey: Key = { version: 42, key: randomBytes(32) };
const createdUsers: string[] = [];
const ids: Record<string, string> = {};
let ownerId: string;
let projectId: string;

async function insertCredential(label: string, secret: string, key: Key) {
  const encrypted = encrypt(secret, credentialAad(ownerId, projectId), key);
  const { data, error } = await admin
    .from('credentials')
    .insert({
      project_id: projectId,
      owner_id: ownerId,
      label,
      secret_ciphertext: toBytea(encrypted.ciphertext),
      secret_iv: toBytea(encrypted.iv),
      secret_tag: toBytea(encrypted.tag),
      key_version: encrypted.keyVersion,
    })
    .select('id')
    .single();
  if (error) throw error;
  ids[label] = data.id;
}

async function read(label: string) {
  const { data } = await admin
    .from('credentials')
    .select('secret_ciphertext, secret_iv, secret_tag, key_version')
    .eq('id', ids[label]!)
    .single();
  return data!;
}

function open(row: Awaited<ReturnType<typeof read>>, key: Buffer) {
  return decrypt(
    {
      ciphertext: fromBytea(row.secret_ciphertext),
      iv: fromBytea(row.secret_iv),
      tag: fromBytea(row.secret_tag),
    },
    credentialAad(ownerId, projectId),
    key,
  );
}

beforeAll(async () => {
  const { data, error } = await admin.auth.admin.createUser({
    email: `rotate-${randomUUID()}@rls.test`,
    password: `pw-${randomUUID()}`,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error('Sin usuario');
  ownerId = data.user.id;
  createdUsers.push(ownerId);

  const project = await admin
    .from('projects')
    .insert({ owner_id: ownerId, code: 'ROT-1', name: 'Rotación', client: 'X', type: 'otro' })
    .select('id')
    .single();
  projectId = project.data!.id;

  await insertCredential('uno', 'secreto-uno', oldKey);
  await insertCredential('dos', 'secreto-dos ñ', oldKey);
  await insertCredential('ya-nueva', 'ya-rotada', newKey);
  await insertCredential('rota', 'se-va-a-manipular', oldKey);
  // Una fila manipulada: no se puede descifrar y no debe tocarse.
  const broken = await read('rota');
  const ciphertext = fromBytea(broken.secret_ciphertext);
  ciphertext[0] = ciphertext[0]! ^ 0xff;
  await admin
    .from('credentials')
    .update({ secret_ciphertext: toBytea(ciphertext) })
    .eq('id', ids.rota!);
});

afterAll(async () => {
  for (const id of createdUsers) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) throw error;
  }
});

describe('rotateCredentials', () => {
  it('rechaza versiones no consecutivas o la misma clave', async () => {
    await expect(
      rotateCredentials(admin, { previous: oldKey, current: { ...newKey, version: 50 } }),
    ).rejects.toThrow('anterior + 1');
    await expect(
      rotateCredentials(admin, { previous: oldKey, current: { version: 42, key: oldKey.key } }),
    ).rejects.toThrow('igual');
  });

  it('--dry-run verifica sin escribir', async () => {
    const before = await read('uno');
    const report = await rotateCredentials(
      admin,
      { previous: oldKey, current: newKey },
      { dryRun: true },
    );
    expect(report).toEqual({ rotated: 2, failed: [ids.rota], dryRun: true });
    expect(await read('uno')).toEqual(before);
  });

  it('rota: lo nuevo se abre con la clave nueva y no con la vieja', async () => {
    const report = await rotateCredentials(admin, { previous: oldKey, current: newKey });
    expect(report).toEqual({ rotated: 2, failed: [ids.rota], dryRun: false });

    for (const [label, secret] of [
      ['uno', 'secreto-uno'],
      ['dos', 'secreto-dos ñ'],
    ] as const) {
      const row = await read(label);
      expect(row.key_version).toBe(42);
      expect(open(row, newKey.key)).toBe(secret);
      expect(() => open(row, oldKey.key)).toThrow();
    }
  });

  it('deja intactas la fila que ya estaba en la versión nueva y la que no se pudo descifrar', async () => {
    expect(open(await read('ya-nueva'), newKey.key)).toBe('ya-rotada');
    expect((await read('rota')).key_version).toBe(41);
  });

  it('volver a correrla no rota nada más (idempotente)', async () => {
    const report = await rotateCredentials(admin, { previous: oldKey, current: newKey });
    expect(report.rotated).toBe(0);
  });
});
