import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { THUMBNAIL_BUCKET } from '@/lib/thumbnails';

// Limpieza de miniaturas en Storage (T24b). Storage no tiene cascadas: al borrar un
// proyecto o una cuenta, sus archivos se borran aparte. Recibe el cliente que
// corresponda: el de la sesión (pasa por la política del bucket) o el admin.

const PAGE = 1000;

/** Nombres dentro de una carpeta (un nivel), página por página. */
async function listNames(client: SupabaseClient, folder: string): Promise<string[]> {
  const names: string[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await client.storage
      .from(THUMBNAIL_BUCKET)
      .list(folder, { limit: PAGE, offset });
    if (error) throw error;
    names.push(...data.map((item) => item.name));
    if (data.length < PAGE) return names;
  }
}

async function removeAll(client: SupabaseClient, paths: string[]): Promise<void> {
  for (let i = 0; i < paths.length; i += PAGE) {
    const { error } = await client.storage.from(THUMBNAIL_BUCKET).remove(paths.slice(i, i + PAGE));
    if (error) throw error;
  }
}

/** Borra todas las miniaturas de un proyecto (`{owner}/{project}/…`), huérfanas incluidas. */
export async function removeProjectThumbnails(
  client: SupabaseClient,
  ownerId: string,
  projectId: string,
): Promise<void> {
  const folder = `${ownerId}/${projectId}`;
  const names = await listNames(client, folder);
  await removeAll(
    client,
    names.map((name) => `${folder}/${name}`),
  );
}

/** Borra la carpeta entera de un usuario (`{owner}/…`): todas sus miniaturas. */
export async function removeOwnerThumbnails(
  client: SupabaseClient,
  ownerId: string,
): Promise<void> {
  for (const projectId of await listNames(client, ownerId)) {
    await removeProjectThumbnails(client, ownerId, projectId);
  }
}
