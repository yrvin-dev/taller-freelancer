-- SOLO LOCAL. Copia los proyectos del usuario demo (seed.sql) a la cuenta con el
-- correo dado, con sus pagos y notas. Se puede repetir: primero borra en esa cuenta
-- los proyectos con los mismos códigos. Uso: `pnpm db:seed-me tu@correo.com`.

\set ON_ERROR_STOP on
select set_config('seed.email', :'email', false) as seed_email \gset

do $$
declare
  demo uuid := '11111111-1111-4111-8111-111111111111';
  target uuid;
  src record;
  copy_id uuid;
begin
  select id into target from auth.users where lower(email) = lower(current_setting('seed.email'));
  if target is null then
    raise exception 'No hay un usuario con el correo %. Entra primero con Google.', current_setting('seed.email');
  end if;
  if target = demo then raise exception 'Ese es el usuario demo.'; end if;

  delete from public.projects
  where owner_id = target and code in (select code from public.projects where owner_id = demo);

  for src in select * from public.projects where owner_id = demo loop
    insert into public.projects
    select * from jsonb_populate_record(
      null::public.projects,
      to_jsonb(src) || jsonb_build_object('id', gen_random_uuid(), 'owner_id', target)
    )
    returning id into copy_id;

    insert into public.payments (project_id, owner_id, amount_pen, paid_on, concept)
    select copy_id, target, amount_pen, paid_on, concept from public.payments where project_id = src.id;

    insert into public.notes (project_id, owner_id, kind, body, noted_on)
    select copy_id, target, kind, body, noted_on from public.notes where project_id = src.id;
  end loop;

  -- Los pagos y notas "tocan" el proyecto: se restaura el orden de recientes del demo.
  alter table public.projects disable trigger projects_set_updated_at;
  update public.projects t set updated_at = d.updated_at
  from public.projects d
  where t.owner_id = target and d.owner_id = demo and d.code = t.code;
  alter table public.projects enable trigger projects_set_updated_at;

  raise notice 'Listo: % proyectos de ejemplo en %.',
    (select count(*) from public.projects where owner_id = target and code in
      (select code from public.projects where owner_id = demo)),
    current_setting('seed.email');
end;
$$;
