import { randomBytes } from 'node:crypto';
import { credentialAad, decrypt, encrypt, fromBytea, toBytea } from '@/lib/crypto';
import { credentialsKeyring } from '@/lib/env-server';

const key = { version: 1, key: randomBytes(32) };
const aad = credentialAad('owner-1', 'project-1');
const flip = (buffer: Buffer, at = 0) => {
  const copy = Buffer.from(buffer);
  copy[at] = copy[at]! ^ 0x01;
  return copy;
};

describe('AES-256-GCM', () => {
  it('ida y vuelta, con IV distinto en cada cifrado', () => {
    const a = encrypt('demo-medusa-admin-2026', aad, key);
    const b = encrypt('demo-medusa-admin-2026', aad, key);
    expect(a.iv).toHaveLength(12);
    expect(a.tag).toHaveLength(16);
    expect(a.keyVersion).toBe(1);
    expect(a.iv.equals(b.iv)).toBe(false);
    expect(a.ciphertext.equals(b.ciphertext)).toBe(false);
    expect(decrypt(a, aad, key.key)).toBe('demo-medusa-admin-2026');
  });

  it('el cifrado no contiene el texto plano', () => {
    const { ciphertext } = encrypt('contraseña-secreta', aad, key);
    expect(ciphertext.toString('utf8')).not.toContain('contraseña');
  });

  it('acepta texto unicode y vacío', () => {
    for (const secret of ['ñandú 🔐 clave', '']) {
      expect(decrypt(encrypt(secret, aad, key), aad, key.key)).toBe(secret);
    }
  });

  it.each([
    ['el tag', (e: ReturnType<typeof encrypt>) => ({ ...e, tag: flip(e.tag) })],
    ['el cifrado', (e: ReturnType<typeof encrypt>) => ({ ...e, ciphertext: flip(e.ciphertext) })],
    ['el IV', (e: ReturnType<typeof encrypt>) => ({ ...e, iv: flip(e.iv) })],
  ])('falla si se manipula %s', (_, tamper) => {
    const encrypted = encrypt('secreto', aad, key);
    expect(() => decrypt(tamper(encrypted), aad, key.key)).toThrow();
  });

  it('falla con otra clave o con otros datos asociados (otra fila u otro dueño)', () => {
    const encrypted = encrypt('secreto', aad, key);
    expect(() => decrypt(encrypted, aad, randomBytes(32))).toThrow();
    expect(() => decrypt(encrypted, credentialAad('owner-1', 'project-2'), key.key)).toThrow();
    expect(() => decrypt(encrypted, credentialAad('owner-2', 'project-1'), key.key)).toThrow();
  });

  it('rechaza claves que no son de 32 bytes', () => {
    expect(() => encrypt('x', aad, { version: 1, key: randomBytes(16) })).toThrow('32 bytes');
  });
});

describe('bytea (PostgREST)', () => {
  it('ida y vuelta en hexadecimal con \\x', () => {
    const buffer = Buffer.from([0, 1, 254, 255]);
    expect(toBytea(buffer)).toBe('\\x0001feff');
    expect(fromBytea(toBytea(buffer)).equals(buffer)).toBe(true);
    expect(() => fromBytea('0001')).toThrow();
  });
});

describe('credentialsKeyring', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('lee la clave actual y la anterior por versión', () => {
    const current = randomBytes(32);
    const previous = randomBytes(32);
    vi.stubEnv('CREDENTIALS_KEY', current.toString('base64'));
    vi.stubEnv('CREDENTIALS_KEY_VERSION', '2');
    vi.stubEnv('CREDENTIALS_KEY_PREVIOUS', previous.toString('base64'));
    const ring = credentialsKeyring();
    expect(ring.current).toEqual({ version: 2, key: current });
    expect(ring.byVersion(2)?.equals(current)).toBe(true);
    expect(ring.byVersion(1)?.equals(previous)).toBe(true);
    expect(ring.byVersion(3)).toBeUndefined();
  });

  it('falla sin mostrar el valor si la clave es inválida', () => {
    vi.stubEnv('CREDENTIALS_KEY', 'corta');
    expect(() => credentialsKeyring()).toThrow(/CREDENTIALS_KEY/);
    try {
      credentialsKeyring();
    } catch (error) {
      expect(String(error)).not.toContain('corta');
    }
  });
});
