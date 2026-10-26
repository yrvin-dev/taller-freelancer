-- 0005 · Miniaturas de proyecto en Supabase Storage (T24a, 03 §… Miniaturas).
--
-- Bucket privado: las imágenes se sirven con URL firmada, nunca públicas. Cada
-- archivo vive en `{owner}/{project_id}/{aleatorio}.webp`: el nombre cambia en cada
-- subida, así ningún CDN sirve una miniatura vieja tras reemplazarla.
--
-- El servidor convierte todo a WebP 1600×1000 antes de subir (sharp): el bucket solo
-- acepta WebP y el límite de 2 MB es un tope de seguridad, no el del formulario.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('thumbnails', 'thumbnails', false, 2097152, array['image/webp']);

-- Misma regla que RLS en las tablas (0002): cada usuario solo toca su carpeta. Al
-- subir, además, la segunda carpeta tiene que ser un proyecto suyo. Dentro del
-- `exists` va `objects.name`: sin calificar, `name` sería el nombre del proyecto.
create policy "miniaturas: leer las propias" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'thumbnails'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "miniaturas: subir a un proyecto propio" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'thumbnails'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.projects p
      where p.id::text = (storage.foldername(objects.name))[2]
        and p.owner_id = (select auth.uid())
    )
  );

create policy "miniaturas: borrar las propias" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'thumbnails'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
