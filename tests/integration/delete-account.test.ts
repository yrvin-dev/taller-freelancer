import { randomBytes, randomUUID } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import type { Database } from '@/lib/database.types';

// Borrar la cuenta (T18) contra la base real: deleteAccount usa el cliente admin real
// (service_role de la Supabase local) y la sesión de un usuario de prueba.

const url = process.env.SUPABASE_TEST_URL!;
const anonKey = process.env.SUPABASE_TEST_ANON_KEY!;
const serviceKey = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY!;
const admin = createClient<Database>(url, serviceKey, { auth: { persistSession: false } });

const session = vi.hoisted(() => ({ client: null as unknown }));
vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: async () => session.client,
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({
  redirect: (to: string) => {
    throw new Error(`REDIRECT:${to}`);
  },
}));

const { deleteAccount } = await import('@/app/(app)/cuenta/actions');
const { addCredential, saveThumbnail } = await import('@/app/(app)/proyectos/[id]/actions');
const { saveProject } = await import('@/app/(app)/proyectos/actions');
const { EMPTY_PROJECT_FORM } = await import('@/lib/project-form');

type User = { id: string; client: SupabaseClient<Database> };
const createdUsers: string[] = [];

async function newUser(): Promise<User> {
  const email = `del-${randomUUID()}@rls.test`;
  const password = `pw-${randomUUID()}`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error('Sin usuario');
  createdUsers.push(data.user.id);
  const client = createClient<Database>(url, anonKey, { auth: { persistSession: false } });
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;
  return { id: data.user.id, client };
}

/** Un usuario con proyecto, pago, nota y credencial: todo lo que debe desaparecer. */
async function userWithData(code: string): Promise<User> {
  const user = await newUser();
  session.client = user.client;
  const created = await saveProject({
    ...EMPTY_PROJECT_FORM,
    name: code,
    client: 'X',
    code,
    budgetPen: '100',
    advancePen: '40',
    firstNote: 'nota',
  });
  if (!created.ok) throw new Error(created.error);
  const credential = await addCredential({
    projectId: created.data.id,
    label: 'Panel',
    secret: 's',
  });
  if (!credential.ok) throw new Error(credential.error);
  const png = await sharp({
    create: { width: 32, height: 20, channels: 3, background: { r: 1, g: 2, b: 3 } },
  })
    .png()
    .toBuffer();
  const thumbnail = new FormData();
  thumbnail.set('thumbnail', new File([new Uint8Array(png)], 'a.png', { type: 'image/png' }));
  const saved = await saveThumbnail(created.data.id, thumbnail);
  if (!saved.ok) throw new Error(saved.error);
  return user;
}

/** Archivos en la carpeta de miniaturas del usuario (`{owner}/{project}/…`). */
async function thumbnailsOf(userId: string): Promise<number> {
  const { data: folders } = await admin.storage.from('thumbnails').list(userId);
  let count = 0;
  for (const folder of folders ?? []) {
    const { data } = await admin.storage.from('thumbnails').list(`${userId}/${folder.name}`);
    count += data?.length ?? 0;
  }
  return count;
}

async function rowsOf(userId: string) {
  const [profiles, projects, payments, notes, credentials] = await Promise.all([
    admin.from('profiles').select('id', { count: 'exact', head: true }).eq('id', userId),
    admin.from('projects').select('id', { count: 'exact', head: true }).eq('owner_id', userId),
    admin.from('payments').select('id', { count: 'exact', head: true }).eq('owner_id', userId),
    admin.from('notes').select('id', { count: 'exact', head: true }).eq('owner_id', userId),
    admin.from('credentials').select('id', { count: 'exact', head: true }).eq('owner_id', userId),
  ]);
  return {
    profiles: profiles.count,
    projects: projects.count,
    payments: payments.count,
    notes: notes.count,
    credentials: credentials.count,
  };
}

beforeAll(() => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', url);
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', anonKey);
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000');
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', serviceKey);
  vi.stubEnv('CREDENTIALS_KEY', randomBytes(32).toString('base64'));
});

afterAll(async () => {
  vi.unstubAllEnvs();
  for (const id of createdUsers) {
    const { data } = await admin.auth.admin.getUserById(id);
    if (!data.user) continue; // ya lo borró el test
    const { data: folders } = await admin.storage.from('thumbnails').list(id);
    for (const folder of folders ?? []) {
      const { data: files } = await admin.storage.from('thumbnails').list(`${id}/${folder.name}`);
      const paths = (files ?? []).map((file) => `${id}/${folder.name}/${file.name}`);
      const removed = paths.length ? await admin.storage.from('thumbnails').remove(paths) : null;
      if (removed?.error) throw removed.error;
    }
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) throw error;
  }
});

describe('deleteAccount', () => {
  it('borra al usuario y no deja ninguna fila suya; otra cuenta queda intacta', async () => {
    const target = await userWithData('DEL-A');
    const bystander = await userWithData('DEL-B');
    expect(await rowsOf(target.id)).toEqual({
      profiles: 1,
      projects: 1,
      payments: 1,
      notes: 1,
      credentials: 1,
    });

    expect(await thumbnailsOf(target.id)).toBe(1);

    session.client = target.client;
    await expect(deleteAccount()).rejects.toThrow('REDIRECT:/login?cuenta=borrada');
    expect(await thumbnailsOf(target.id)).toBe(0);
    expect(await thumbnailsOf(bystander.id)).toBe(1);

    const { data } = await admin.auth.admin.getUserById(target.id);
    expect(data.user).toBeNull();
    expect(await rowsOf(target.id)).toEqual({
      profiles: 0,
      projects: 0,
      payments: 0,
      notes: 0,
      credentials: 0,
    });
    expect(await rowsOf(bystander.id)).toEqual({
      profiles: 1,
      projects: 1,
      payments: 1,
      notes: 1,
      credentials: 1,
    });
  });

  it('sin sesión no borra nada', async () => {
    const anon = createClient<Database>(url, anonKey, { auth: { persistSession: false } });
    session.client = anon;
    await expect(deleteAccount()).resolves.toEqual({
      ok: false,
      error: 'Tu sesión expiró. Vuelve a entrar.',
      code: 'unauthorized',
    });
  });
});
