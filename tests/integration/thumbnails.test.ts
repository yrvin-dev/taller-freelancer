import { randomUUID } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import type { Database } from '@/lib/database.types';

// Miniaturas (T24a) contra la Supabase local: las acciones de verdad y las políticas
// del bucket `thumbnails`. Igual que actions.test.ts, solo se simula de dónde sale el
// cliente de Supabase.

const url = process.env.SUPABASE_TEST_URL!;
const anonKey = process.env.SUPABASE_TEST_ANON_KEY!;
const admin = createClient<Database>(url, process.env.SUPABASE_TEST_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

const session = vi.hoisted(() => ({ client: null as unknown }));
vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: async () => session.client,
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const { saveThumbnail, removeThumbnail } = await import('@/app/(app)/proyectos/[id]/actions');
const { getProject } = await import('@/lib/data/projects');

type User = { id: string; client: SupabaseClient<Database>; projectId: string };
const createdUsers: string[] = [];

async function newUser(): Promise<User> {
  const email = `thumbs-${randomUUID()}@rls.test`;
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

  const { data: project, error: projectError } = await client
    .from('projects')
    .insert({
      code: `T-${randomUUID().slice(0, 8).toUpperCase()}`,
      name: 'Con miniatura',
      client: 'Cliente',
      type: 'landing',
    })
    .select('id')
    .single();
  if (projectError) throw projectError;
  return { id: data.user.id, client, projectId: project.id };
}

const as = (user: User) => {
  session.client = user.client;
};

async function pngForm(): Promise<FormData> {
  const png = await sharp({
    create: { width: 400, height: 300, channels: 3, background: { r: 200, g: 100, b: 50 } },
  })
    .png()
    .toBuffer();
  const data = new FormData();
  data.set('thumbnail', new File([new Uint8Array(png)], 'captura.png', { type: 'image/png' }));
  return data;
}

async function thumbnailPath(projectId: string): Promise<string | null> {
  const { data } = await admin
    .from('projects')
    .select('thumbnail_path')
    .eq('id', projectId)
    .single();
  return data!.thumbnail_path;
}

async function stored(path: string): Promise<boolean> {
  const [folder, project, name] = path.split('/');
  const { data } = await admin.storage
    .from('thumbnails')
    .list(`${folder}/${project}`, { search: name });
  return !!data?.some((file) => file.name === name);
}

let a: User;
let b: User;

beforeAll(async () => {
  a = await newUser();
  b = await newUser();
});

afterAll(async () => {
  for (const id of createdUsers) {
    const { data: folders } = await admin.storage.from('thumbnails').list(id);
    for (const folder of folders ?? []) {
      const { data: files } = await admin.storage.from('thumbnails').list(`${id}/${folder.name}`);
      const paths = (files ?? []).map((file) => `${id}/${folder.name}/${file.name}`);
      if (paths.length) {
        const { error } = await admin.storage.from('thumbnails').remove(paths);
        if (error) throw error;
      }
    }
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) throw error;
  }
});

describe('saveThumbnail / removeThumbnail', () => {
  it('sube un WebP 1600×1000 a la carpeta del dueño y lo firma al leer', async () => {
    as(a);
    expect(await saveThumbnail(a.projectId, await pngForm())).toEqual({
      ok: true,
      data: undefined,
    });

    const path = await thumbnailPath(a.projectId);
    expect(path).toMatch(new RegExp(`^${a.id}/${a.projectId}/[0-9a-f-]{36}\\.webp$`));

    const lookup = await getProject(a.projectId);
    const signedUrl = lookup.status === 'ok' ? lookup.project.thumbnailUrl : null;
    expect(signedUrl).toContain('/storage/v1/object/sign/thumbnails/');
    const response = await fetch(signedUrl!);
    expect(response.headers.get('content-type')).toBe('image/webp');
    const meta = await sharp(Buffer.from(await response.arrayBuffer())).metadata();
    expect(meta).toMatchObject({ format: 'webp', width: 1600, height: 1000 });
  });

  it('al reemplazarla, borra la anterior de Storage', async () => {
    as(a);
    const before = (await thumbnailPath(a.projectId))!;
    expect((await saveThumbnail(a.projectId, await pngForm())).ok).toBe(true);
    const after = (await thumbnailPath(a.projectId))!;

    expect(after).not.toBe(before);
    expect(await stored(after)).toBe(true);
    expect(await stored(before)).toBe(false);
  });

  it('valida el archivo también en el servidor', async () => {
    as(a);
    const gif = new FormData();
    gif.set('thumbnail', new File(['GIF89a'], 'a.gif', { type: 'image/gif' }));
    expect(await saveThumbnail(a.projectId, gif)).toMatchObject({ ok: false });

    const fake = new FormData();
    fake.set('thumbnail', new File(['no soy un png'], 'a.png', { type: 'image/png' }));
    expect(await saveThumbnail(a.projectId, fake)).toMatchObject({
      ok: false,
      error: 'No pudimos leer la imagen. Usa un PNG, JPG o WebP.',
    });
    expect(await saveThumbnail(a.projectId, new FormData())).toMatchObject({ ok: false });
  });

  it('B no puede cambiar ni quitar la miniatura de un proyecto de A', async () => {
    const path = await thumbnailPath(a.projectId);
    as(b);
    expect(await saveThumbnail(a.projectId, await pngForm())).toMatchObject({
      ok: false,
      error: 'No encontramos ese proyecto.',
    });
    expect(await removeThumbnail(a.projectId)).toMatchObject({ ok: false });
    expect(await thumbnailPath(a.projectId)).toBe(path);
    expect(await stored(path!)).toBe(true);
  });

  it('quitarla deja el proyecto sin miniatura y borra el archivo', async () => {
    as(a);
    const path = (await thumbnailPath(a.projectId))!;
    expect(await removeThumbnail(a.projectId)).toEqual({ ok: true, data: undefined });
    expect(await thumbnailPath(a.projectId)).toBeNull();
    expect(await stored(path)).toBe(false);
  });
});

describe('políticas del bucket thumbnails', () => {
  const webp = () =>
    sharp({ create: { width: 16, height: 10, channels: 3, background: { r: 0, g: 0, b: 0 } } })
      .webp()
      .toBuffer();
  const upload = (user: User, path: string, body: Buffer, contentType = 'image/webp') =>
    user.client.storage.from('thumbnails').upload(path, body, { contentType });

  it('nadie sube a la carpeta de otro, ni a su carpeta con un proyecto ajeno', async () => {
    const body = await webp();
    expect((await upload(b, `${a.id}/${a.projectId}/x.webp`, body)).error).not.toBeNull();
    expect((await upload(b, `${b.id}/${a.projectId}/x.webp`, body)).error).not.toBeNull();
    expect((await upload(b, `${b.id}/${b.projectId}/ok.webp`, body)).error).toBeNull();
  });

  it('el bucket solo acepta WebP', async () => {
    const png = await sharp(await webp())
      .png()
      .toBuffer();
    expect(
      (await upload(b, `${b.id}/${b.projectId}/x.png`, png, 'image/png')).error,
    ).not.toBeNull();
  });

  it('nadie lee ni firma ni borra un archivo ajeno', async () => {
    as(a);
    expect((await saveThumbnail(a.projectId, await pngForm())).ok).toBe(true);
    const path = (await thumbnailPath(a.projectId))!;
    const bucket = b.client.storage.from('thumbnails');

    expect((await bucket.download(path)).data).toBeNull();
    expect((await bucket.createSignedUrl(path, 60)).data).toBeNull();
    expect((await bucket.list(`${a.id}/${a.projectId}`)).data).toEqual([]);
    await bucket.remove([path]);
    expect(await stored(path)).toBe(true);
  });

  it('sin sesión no se lee nada (bucket privado)', async () => {
    const path = (await thumbnailPath(a.projectId))!;
    const anon = createClient<Database>(url, anonKey, { auth: { persistSession: false } });
    expect((await anon.storage.from('thumbnails').download(path)).data).toBeNull();
    const response = await fetch(`${url}/storage/v1/object/public/thumbnails/${path}`);
    expect(response.ok).toBe(false);
  });
});
