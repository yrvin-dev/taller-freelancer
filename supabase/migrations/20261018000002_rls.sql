-- 0002 · Row Level Security en todas las tablas (CLAUDE.md, regla 5).
-- Cada usuario solo ve y modifica lo suyo. Políticas por operación, solo para
-- `authenticated`, con (select auth.uid()) para que Postgres lo evalúe una vez.

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.payments enable row level security;
alter table public.notes enable row level security;
alter table public.credentials enable row level security;

-- Defensa en profundidad: el rol anónimo no tiene ningún permiso en el esquema.
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke all on all functions in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on sequences from anon;
alter default privileges in schema public revoke all on functions from anon;

-- ── profiles: id = auth.uid(); el perfil lo crea handle_new_user ───────
create policy "perfil: leer el propio" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "perfil: editar el propio" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- ── projects ───────────────────────────────────────────────────────────
create policy "proyectos: leer los propios" on public.projects
  for select to authenticated using (owner_id = (select auth.uid()));
create policy "proyectos: crear como dueño" on public.projects
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "proyectos: editar los propios" on public.projects
  for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "proyectos: borrar los propios" on public.projects
  for delete to authenticated using (owner_id = (select auth.uid()));

-- ── payments / notes / credentials: la misma regla. La FK compuesta asegura
--    además que el proyecto padre sea del mismo dueño. ─────────────────
create policy "pagos: leer los propios" on public.payments
  for select to authenticated using (owner_id = (select auth.uid()));
create policy "pagos: crear como dueño" on public.payments
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "pagos: editar los propios" on public.payments
  for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "pagos: borrar los propios" on public.payments
  for delete to authenticated using (owner_id = (select auth.uid()));

create policy "notas: leer las propias" on public.notes
  for select to authenticated using (owner_id = (select auth.uid()));
create policy "notas: crear como dueño" on public.notes
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "notas: editar las propias" on public.notes
  for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "notas: borrar las propias" on public.notes
  for delete to authenticated using (owner_id = (select auth.uid()));

create policy "credenciales: leer las propias" on public.credentials
  for select to authenticated using (owner_id = (select auth.uid()));
create policy "credenciales: crear como dueño" on public.credentials
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "credenciales: editar las propias" on public.credentials
  for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "credenciales: borrar las propias" on public.credentials
  for delete to authenticated using (owner_id = (select auth.uid()));

-- Funciones de triggers: no son API. Nadie las llama directamente.
revoke execute on function public.set_updated_at() from public, authenticated;
revoke execute on function public.touch_project() from public, authenticated;
revoke execute on function public.handle_new_user() from public, authenticated;
