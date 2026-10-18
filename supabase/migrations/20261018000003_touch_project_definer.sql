-- 0003 · Corrige touch_project (bug de 0001, encontrado en T15a).
--
-- Al borrar un usuario desde la API, Supabase Auth corre con el rol
-- `supabase_auth_admin`, que no tiene permisos sobre public.projects. La cascada
-- borra los pagos y notas del usuario, el trigger intenta actualizar su proyecto y
-- falla con "permission denied for table projects": "Borrar cuenta" no funcionaba
-- para ningún usuario con pagos o notas.
--
-- Con `security definer` el trigger corre como su dueño. Es seguro: solo toca
-- `updated_at` del proyecto de la fila que se escribió, y esa fila ya pasó la RLS
-- (y la FK compuesta garantiza que el proyecto es del mismo dueño).

create or replace function public.touch_project() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.projects set updated_at = now()
  where id = coalesce(new.project_id, old.project_id);
  return null;
end;
$$;

revoke execute on function public.touch_project() from public, authenticated, anon;
