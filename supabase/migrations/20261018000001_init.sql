-- 0001 · Esquema inicial de Taller Freelancer (03 §5).
-- Un proyecto = un cliente. Cada fila tiene dueño (owner_id); RLS en 0002.

-- ── Enums (src/lib/domain.ts) ──────────────────────────────────────────
create type public.project_status as enum ('en_desarrollo', 'revision', 'produccion', 'mantenimiento', 'archivado');
create type public.project_type as enum ('landing', 'ecommerce', 'dashboard', 'institucional', 'webapp', 'otro');
create type public.note_kind as enum ('pedido', 'cambio', 'nota');

-- ── Perfiles (uno por usuario de auth) ────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 60),
  avatar_url text,
  base_path text check (char_length(base_path) <= 260),
  theme text not null default 'light' check (theme in ('light', 'dark')),
  accent text not null default 'naranja'
    check (accent in ('naranja', 'terracota', 'mandarina', 'azul', 'turquesa')),
  bg_variant text not null default 'arena' check (bg_variant in ('arena', 'pizarra', 'salvia')),
  created_at timestamptz not null default now()
);

-- ── Proyectos ──────────────────────────────────────────────────────────
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  code text not null check (code ~ '^[A-Z0-9-]{1,20}$'),
  name text not null check (char_length(name) between 1 and 120),
  client text not null check (char_length(client) between 1 and 120),
  client_contact text check (char_length(client_contact) <= 120),
  client_email text check (char_length(client_email) <= 254),
  client_whatsapp text check (char_length(client_whatsapp) <= 25),
  client_country text check (char_length(client_country) <= 60),
  type public.project_type not null,
  status public.project_status not null default 'en_desarrollo',
  is_demo boolean not null default false, -- proyectos ficticios "(F)"
  description text check (char_length(description) <= 1000),
  start_date date,
  delivery_date date,
  stack_frontend text[] not null default '{}',
  stack_backend text[] not null default '{}',
  stack_db text[] not null default '{}',
  stack_hosting text[] not null default '{}',
  cms text check (char_length(cms) <= 60),
  local_path text check (char_length(local_path) <= 260),
  link_repo text check (char_length(link_repo) <= 500),
  link_deploy text check (char_length(link_deploy) <= 500),
  link_design text check (char_length(link_design) <= 500),
  link_cms text check (char_length(link_cms) <= 500),
  link_panel text check (char_length(link_panel) <= 500),
  domain_name text,
  domain_expires date,
  domain_pending boolean not null default false,
  hosting_expires date,
  budget_pen numeric(10, 2) check (budget_pen >= 0),
  thumbnail_path text, -- Storage: thumbnails/{owner}/{id}.webp
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, code),
  -- Destino de las FK compuestas de las tablas hijas (ver abajo).
  unique (id, owner_id)
);

create index projects_owner_status_idx on public.projects (owner_id, status);
create index projects_search_idx on public.projects
  using gin (to_tsvector('spanish', name || ' ' || client || ' ' || code));

-- Las tablas hijas llevan owner_id y una FK compuesta (project_id, owner_id): la base
-- garantiza que el dueño de un pago, nota o credencial es el dueño de su proyecto,
-- aunque una política RLS tuviera un error.

-- ── Pagos ──────────────────────────────────────────────────────────────
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  amount_pen numeric(10, 2) not null check (amount_pen > 0),
  paid_on date not null,
  concept text check (char_length(concept) <= 120),
  created_at timestamptz not null default now(),
  foreign key (project_id, owner_id) references public.projects (id, owner_id) on delete cascade
);
create index payments_project_idx on public.payments (project_id);

-- ── Bitácora ───────────────────────────────────────────────────────────
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  kind public.note_kind not null,
  body text not null check (char_length(body) between 1 and 2000),
  noted_on date not null default current_date,
  created_at timestamptz not null default now(),
  foreign key (project_id, owner_id) references public.projects (id, owner_id) on delete cascade
);
create index notes_project_idx on public.notes (project_id, noted_on desc);

-- ── Credenciales (el secreto llega cifrado con AES-256-GCM desde el servidor) ──
create table public.credentials (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  label text not null check (char_length(label) between 1 and 80),
  url text check (char_length(url) <= 500),
  username text check (char_length(username) <= 120),
  secret_ciphertext bytea not null,
  secret_iv bytea not null check (octet_length(secret_iv) = 12),
  secret_tag bytea not null check (octet_length(secret_tag) = 16),
  key_version smallint not null default 1,
  created_at timestamptz not null default now(),
  foreign key (project_id, owner_id) references public.projects (id, owner_id) on delete cascade
);
create index credentials_project_idx on public.credentials (project_id);

-- ── updated_at ─────────────────────────────────────────────────────────
create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- Un pago, nota o credencial nueva cuenta como actividad del proyecto ("Actualizado"
-- en los recientes). Corre como el usuario: RLS solo le deja tocar sus proyectos.
create function public.touch_project() returns trigger
language plpgsql set search_path = '' as $$
begin
  update public.projects set updated_at = now()
  where id = coalesce(new.project_id, old.project_id);
  return null;
end;
$$;

create trigger payments_touch_project after insert or update or delete on public.payments
  for each row execute function public.touch_project();
create trigger notes_touch_project after insert or update or delete on public.notes
  for each row execute function public.touch_project();
create trigger credentials_touch_project after insert or update or delete on public.credentials
  for each row execute function public.touch_project();

-- ── Perfil al registrarse (datos de Google en raw_user_meta_data) ─────
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    left(coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      split_part(new.email, '@', 1)
    ), 60),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Resumen de pagos por proyecto (Home y tarjetas) ───────────────────
-- security_invoker: la vista aplica la RLS de quien consulta, no la de su dueño.
-- Los días a la entrega se calculan en la app con la hora de Lima (la base va en UTC).
create view public.project_summary with (security_invoker = true) as
select
  p.id,
  p.owner_id,
  p.budget_pen,
  coalesce(sum(pay.amount_pen), 0)::numeric(10, 2) as paid_pen,
  case when p.budget_pen is null then null
       else (p.budget_pen - coalesce(sum(pay.amount_pen), 0))::numeric(10, 2) end as balance_pen
from public.projects p
left join public.payments pay on pay.project_id = p.id
group by p.id;
