-- 0004 · ¿Existe este proyecto? (403 vs 404 en la ficha, 03 §7).
--
-- RLS oculta los proyectos ajenos: para la app, "no es tuyo" y "no existe" se ven
-- igual (ninguna fila). Esta función distingue los dos casos devolviendo SOLO un
-- booleano: nunca expone datos del proyecto. Los ids son UUID aleatorios, así que
-- saber que uno existe no permite enumerar nada.

create function public.project_exists(p_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.projects where id = p_id);
$$;

revoke execute on function public.project_exists(uuid) from public, anon;
grant execute on function public.project_exists(uuid) to authenticated;
