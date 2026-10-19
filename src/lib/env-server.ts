import 'server-only';
import { z } from 'zod';
import type { Key } from './crypto';

// Variables SOLO de servidor (nunca `NEXT_PUBLIC_`): no llegan al navegador. Se leen
// en cada uso (sin caché) para que una rotación de clave no exija reiniciar los tests.

const base64Key = z
  .string()
  .min(1)
  .refine((v) => Buffer.from(v, 'base64').length === 32, 'Debe ser base64 de 32 bytes.');

const schema = z.object({
  CREDENTIALS_KEY: base64Key,
  CREDENTIALS_KEY_VERSION: z.coerce.number().int().min(1).default(1),
  // Solo durante una rotación (scripts/rotate-key.ts): la clave anterior.
  CREDENTIALS_KEY_PREVIOUS: base64Key.optional().or(z.literal('').transform(() => undefined)),
});

export type Keyring = { current: Key; byVersion(version: number): Buffer | undefined };

/** Claves de cifrado desde el entorno. Falla con un mensaje claro si falta o es inválida. */
export function credentialsKeyring(): Keyring {
  const parsed = schema.safeParse({
    CREDENTIALS_KEY: process.env.CREDENTIALS_KEY,
    CREDENTIALS_KEY_VERSION: process.env.CREDENTIALS_KEY_VERSION || undefined,
    CREDENTIALS_KEY_PREVIOUS: process.env.CREDENTIALS_KEY_PREVIOUS,
  });
  if (!parsed.success) {
    // Sin el valor: solo qué variable está mal.
    throw new Error(
      `Configuración de cifrado inválida: ${parsed.error.issues.map((i) => i.path.join('.')).join(', ')}`,
    );
  }
  const env = parsed.data;
  const current: Key = {
    version: env.CREDENTIALS_KEY_VERSION,
    key: Buffer.from(env.CREDENTIALS_KEY, 'base64'),
  };
  const previous = env.CREDENTIALS_KEY_PREVIOUS
    ? Buffer.from(env.CREDENTIALS_KEY_PREVIOUS, 'base64')
    : undefined;

  return {
    current,
    byVersion: (version) =>
      version === current.version
        ? current.key
        : version === current.version - 1
          ? previous
          : undefined,
  };
}
