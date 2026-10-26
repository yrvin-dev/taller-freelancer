// @vitest-environment node
import sharp from 'sharp';
import { toProject, type ProjectRow } from '@/lib/data/project-mapper';
import { toThumbnailWebp } from '@/lib/thumbnail-image';
import { isStaticThumbnail, isStoragePath, thumbnailObjectPath } from '@/lib/thumbnails';

const image = (format: 'png' | 'jpeg' | 'webp' | 'gif', width = 800, height = 800) =>
  sharp({ create: { width, height, channels: 3, background: { r: 10, g: 20, b: 30 } } })
    .toFormat(format)
    .toBuffer();

const arrayBuffer = (buffer: Buffer) =>
  buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;

describe('toThumbnailWebp', () => {
  it.each(['png', 'jpeg', 'webp'] as const)('convierte %s a WebP 1600×1000', async (format) => {
    const out = await toThumbnailWebp(arrayBuffer(await image(format)));
    const meta = await sharp(out!).metadata();
    expect(meta).toMatchObject({ format: 'webp', width: 1600, height: 1000 });
  });

  it('descarta los metadatos EXIF (GPS, cámara…)', async () => {
    const withExif = await sharp(await image('jpeg'))
      .withExif({ IFD0: { Make: 'Camara de prueba' } })
      .toBuffer();
    expect((await sharp(withExif).metadata()).exif).toBeDefined();

    const out = await toThumbnailWebp(arrayBuffer(withExif));
    expect((await sharp(out!).metadata()).exif).toBeUndefined();
  });

  it('rechaza lo que no es PNG, JPG o WebP, aunque el navegador diga que sí', async () => {
    expect(await toThumbnailWebp(arrayBuffer(await image('gif')))).toBeNull();
    expect(await toThumbnailWebp(arrayBuffer(Buffer.from('<svg></svg>')))).toBeNull();
    expect(await toThumbnailWebp(arrayBuffer(Buffer.from('no soy una imagen')))).toBeNull();
  });
});

describe('rutas de miniatura', () => {
  it('la ruta en Storage empieza por el dueño y el proyecto, con nombre nuevo cada vez', () => {
    const a = thumbnailObjectPath('owner', 'project');
    expect(a).toMatch(/^owner\/project\/[0-9a-f-]{36}\.webp$/);
    expect(thumbnailObjectPath('owner', 'project')).not.toBe(a);
  });

  it('distingue Storage de los archivos de public/', () => {
    expect(isStoragePath('u/p/x.webp')).toBe(true);
    expect(isStoragePath('/mock/thumbs/a.webp')).toBe(false);
    expect(isStoragePath(null)).toBe(false);
    expect(isStaticThumbnail('/mock/thumbs/a.webp')).toBe(true);
    expect(isStaticThumbnail('https://x.supabase.co/storage/v1/object/sign/…')).toBe(false);
  });

  it('toProject usa la URL firmada para Storage y la ruta tal cual para public/', () => {
    const row = (thumbnail_path: string | null) =>
      ({ thumbnail_path, payments: [], notes: [], credentials: [] }) as unknown as ProjectRow;
    const signed = new Map([['u/p/x.webp', 'https://firmada']]);

    expect(toProject(row('u/p/x.webp'), signed).thumbnailUrl).toBe('https://firmada');
    expect(toProject(row('u/p/sin-firma.webp'), signed).thumbnailUrl).toBeNull();
    expect(toProject(row('/mock/thumbs/a.webp'), signed).thumbnailUrl).toBe('/mock/thumbs/a.webp');
    expect(toProject(row(null), signed).thumbnailUrl).toBeNull();
  });
});
