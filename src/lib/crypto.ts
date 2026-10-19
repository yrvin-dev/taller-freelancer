import 'server-only';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

// Cifrado de credenciales de clientes (03 §7, CLAUDE.md regla 6): AES-256-GCM con
// IV aleatorio de 12 bytes por secreto y tag de 16 bytes. GCM autentica: si alguien
// altera el cifrado, el IV, el tag o los datos asociados, `decrypt` lanza.

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const KEY_BYTES = 32;

export type Encrypted = { ciphertext: Buffer; iv: Buffer; tag: Buffer; keyVersion: number };
export type Key = { version: number; key: Buffer };

/**
 * Datos asociados (AAD): atan el cifrado a su dueño y su proyecto. Copiar el
 * cifrado de una fila a otra (de otro proyecto o de otro usuario) hace fallar el
 * descifrado, aunque alguien tenga acceso directo a la base.
 */
export function credentialAad(ownerId: string, projectId: string): string {
  return `taller-freelancer:credential:v1:${ownerId}:${projectId}`;
}

function assertKey(key: Buffer) {
  if (key.length !== KEY_BYTES) throw new Error('La clave de cifrado debe tener 32 bytes.');
}

export function encrypt(plaintext: string, aad: string, { version, key }: Key): Encrypted {
  assertKey(key);
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  cipher.setAAD(Buffer.from(aad, 'utf8'));
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return { ciphertext, iv, tag: cipher.getAuthTag(), keyVersion: version };
}

/** Lanza si la clave no es la correcta o si cualquier parte fue manipulada. */
export function decrypt(
  encrypted: Omit<Encrypted, 'keyVersion'>,
  aad: string,
  key: Buffer,
): string {
  assertKey(key);
  const decipher = createDecipheriv(ALGORITHM, key, encrypted.iv);
  decipher.setAAD(Buffer.from(aad, 'utf8'));
  decipher.setAuthTag(encrypted.tag);
  return Buffer.concat([decipher.update(encrypted.ciphertext), decipher.final()]).toString('utf8');
}

// PostgREST intercambia `bytea` como texto hexadecimal con el prefijo `\x`.
export const toBytea = (buffer: Buffer): string => `\\x${buffer.toString('hex')}`;

export function fromBytea(value: string): Buffer {
  if (!value.startsWith('\\x')) throw new Error('bytea con formato inesperado');
  return Buffer.from(value.slice(2), 'hex');
}
