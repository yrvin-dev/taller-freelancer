import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { credentialAad, decrypt, encrypt, fromBytea, toBytea, type Key } from './crypto';
import type { Database } from './database.types';

// Rotación de CREDENTIALS_KEY (CLAUDE.md, Seguridad): re-cifra con la clave nueva las
// credenciales que siguen en la versión anterior. Es una tarea de administración: usa
// `service_role` (regla 5) porque recorre las credenciales de todos los usuarios.

export type RotationKeys = { previous: Key; current: Key };
export type RotationReport = { rotated: number; failed: string[]; dryRun: boolean };

const PAGE = 200;

/**
 * - Solo toca filas con `key_version = previous.version`: re-ejecutarla es seguro.
 * - Una fila que no se puede descifrar se reporta (solo su id) y se deja intacta.
 * - `dryRun`: verifica que todo se descifre, sin escribir.
 * - Nunca devuelve ni registra secretos.
 */
export async function rotateCredentials(
  admin: SupabaseClient<Database>,
  { previous, current }: RotationKeys,
  { dryRun = false } = {},
): Promise<RotationReport> {
  if (current.version !== previous.version + 1) {
    throw new Error('La versión de la clave nueva debe ser la anterior + 1.');
  }
  if (current.key.equals(previous.key)) throw new Error('La clave nueva es igual a la anterior.');

  const report: RotationReport = { rotated: 0, failed: [], dryRun };
  let lastId = '00000000-0000-0000-0000-000000000000';

  for (;;) {
    // Paginado por id (no por offset): las filas rotadas salen del filtro mientras se avanza.
    const { data: rows, error } = await admin
      .from('credentials')
      .select('id, owner_id, project_id, secret_ciphertext, secret_iv, secret_tag')
      .eq('key_version', previous.version)
      .gt('id', lastId)
      .order('id')
      .limit(PAGE);
    if (error) throw new Error(`No se pudieron leer las credenciales: ${error.code}`);
    if (!rows.length) break;

    for (const row of rows) {
      lastId = row.id;
      const aad = credentialAad(row.owner_id, row.project_id);
      let secret: string;
      try {
        secret = decrypt(
          {
            ciphertext: fromBytea(row.secret_ciphertext),
            iv: fromBytea(row.secret_iv),
            tag: fromBytea(row.secret_tag),
          },
          aad,
          previous.key,
        );
      } catch {
        report.failed.push(row.id);
        continue;
      }
      if (dryRun) {
        report.rotated++;
        continue;
      }

      const next = encrypt(secret, aad, current);
      const { error: updateError } = await admin
        .from('credentials')
        .update({
          secret_ciphertext: toBytea(next.ciphertext),
          secret_iv: toBytea(next.iv),
          secret_tag: toBytea(next.tag),
          key_version: next.keyVersion,
        })
        .eq('id', row.id)
        .eq('key_version', previous.version); // si otro proceso ya la rotó, no se pisa
      if (updateError) report.failed.push(row.id);
      else report.rotated++;
    }
  }

  return report;
}
