// Miniaturas de proyecto (T24a): reglas compartidas entre el formulario (cliente) y
// las Server Actions. Sin imports de servidor.

export const THUMBNAIL_BUCKET = 'thumbnails';
export const THUMBNAIL_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
export const THUMBNAIL_MAX_BYTES = 2 * 1024 * 1024;
/** Tamaño final en Storage (16:10, el del export). */
export const THUMBNAIL_SIZE = { width: 1600, height: 1000 } as const;
/** Vigencia de las URL firmadas: las páginas se renderizan en cada pedido. */
export const THUMBNAIL_URL_TTL_SECONDS = 60 * 60;

/** Qué hacer con la miniatura al guardar el formulario; `null` = no tocarla. */
export type ThumbnailChange = { file: File } | 'remove' | null;

/** Mensaje de error de un archivo, o null si sirve como miniatura. */
export function thumbnailError(file: Pick<File, 'type' | 'size'>): string | null {
  if (!(THUMBNAIL_TYPES as readonly string[]).includes(file.type)) {
    return 'Usa una imagen PNG, JPG o WebP.';
  }
  if (file.size > THUMBNAIL_MAX_BYTES) return 'La imagen pesa más de 2 MB.';
  return null;
}

/**
 * Ruta en el bucket: `{owner}/{project}/{aleatorio}.webp`. La primera carpeta es la
 * que mira la política de Storage; el nombre cambia en cada subida para que ningún
 * CDN sirva la imagen anterior.
 */
export function thumbnailObjectPath(ownerId: string, projectId: string): string {
  return `${ownerId}/${projectId}/${crypto.randomUUID()}.webp`;
}

/** Las rutas que empiezan con `/` son archivos de `public/` (seed local), no de Storage. */
export function isStoragePath(path: string | null): path is string {
  return !!path && !path.startsWith('/');
}

/**
 * Para `next/image`: solo las de `public/` pasan por el optimizador. Las de Storage
 * ya son WebP del tamaño justo y su URL firmada cambia en cada pedido, así que el
 * optimizador nunca reusaría su caché (y gastaría el cupo de Vercel): `unoptimized`.
 */
export function isStaticThumbnail(url: string): boolean {
  return url.startsWith('/');
}
