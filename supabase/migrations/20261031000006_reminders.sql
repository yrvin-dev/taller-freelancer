-- 0006 · Recordatorios por correo (T30a).
--
-- Preferencias en el perfil: desactivados por defecto (cada usuario los activa en
-- Cuenta; nadie recibe correos que no pidió) y la anticipación en días.
--
-- `reminder_log` anota cada aviso enviado para no repetirlo: un aviso por proyecto,
-- tipo y fecha. Si el usuario cambia la fecha, es un aviso nuevo. Lo escribe solo la
-- tarea programada (service_role, T30b); el usuario puede leer los suyos.

alter table public.profiles
  add column reminders_enabled boolean not null default false,
  add column reminder_days smallint not null default 7 check (reminder_days in (3, 7, 14));

create table public.reminder_log (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  owner_id uuid not null references auth.users on delete cascade,
  kind text not null check (kind in ('entrega', 'dominio', 'hosting')),
  due_on date not null,
  sent_at timestamptz not null default now(),
  unique (project_id, kind, due_on),
  -- Misma regla que las otras tablas hijas (0001): el proyecto es del mismo dueño.
  foreign key (project_id, owner_id) references public.projects (id, owner_id) on delete cascade
);

alter table public.reminder_log enable row level security;

-- Sin políticas de escritura: para `authenticated` es de solo lectura. La tarea
-- programada escribe con service_role, que se salta RLS (regla 5, uso documentado).
create policy "recordatorios: leer los propios" on public.reminder_log
  for select to authenticated using (owner_id = (select auth.uid()));

revoke all on public.reminder_log from anon;
