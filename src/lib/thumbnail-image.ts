import 'server-only';
import sharp from 'sharp';
import { THUMBNAIL_SIZE } from '@/lib/thumbnails';

const FORMATS = new Set(['png', 'jpeg', 'webp']);

/**
 * Convierte la imagen subida a la miniatura final: WebP 1600×1000 recortado al
 * centro. El tipo se comprueba leyendo el archivo (no el `type` que manda el
 * navegador) y sharp descarta los metadatos (EXIF, GPS) al reescribirla.
 * Devuelve null si no es un PNG, JPG o WebP legible.
 */
export async function toThumbnailWebp(bytes: ArrayBuffer): Promise<Buffer | null> {
  try {
    // Tope de píxeles: un PNG chico puede declarar dimensiones enormes.
    const image = sharp(Buffer.from(bytes), { limitInputPixels: 50_000_000 });
    const { format } = await image.metadata();
    if (!format || !FORMATS.has(format)) return null;
    return await image
      .rotate() // respeta la orientación EXIF antes de que se descarte
      .resize(THUMBNAIL_SIZE.width, THUMBNAIL_SIZE.height, { fit: 'cover' })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    return null;
  }
}
