# 03 · Arquitectura — Taller Freelancer

> Spec técnico. Cómo se construye lo que define `01-requerimientos.md` con el look de `02-design-system.md`.

## 1. Decisiones tomadas

| Tema | Decisión |
|---|---|
| Backend | **Supabase** (Postgres + Auth + RLS + Storage). La capa `src/lib/data/*` aísla el acceso a datos para poder migrar a otra API sin tocar la UI. |
| Usuarios | Multiusuario, **sin roles**. La autorización es por dueño (`owner_id = auth.uid()`). |
| Login | Google OAuth (Supabase Auth). |
| Vista de proyectos | Tarjetas + tabla con un switch (como en el export). El Kanban queda para la fase 2. |
| Estados | `en_desarrollo` · `revision` · `produccion` · `mantenimiento` · `archivado` (los del export). |
| Credenciales | Cifradas en el MVP (AES-256-GCM en el servidor). |
| Monto y pagos | Sí: monto total más pagos parciales, en PEN. |
| Rendering | Next.js App Router con SSR para las páginas y Server Actions para las mutaciones. |

## 2. Estructura de carpetas

```
taller-freelancer/
├─ .github/workflows/ci.yml
├─ docs/                      # 01, 02, 03, 04 (CLAUDE.md va en la raíz)
├─ public/
├─ scripts/rotate-key.ts
├─ supabase/
│  ├─ migrations/             # SQL versionado (tablas, RLS, triggers)
│  └─ seed.sql                # datos de demo (proyectos con prefijo "(F)")
├─ src/
│  ├─ app/
│  │  ├─ (auth)/login/page.tsx
│  │  ├─ auth/callback/route.ts
│  │  ├─ (app)/layout.tsx             # Sidebar + header + guard de sesión
│  │  ├─ (app)/page.tsx               # Home
│  │  ├─ (app)/proyectos/page.tsx
│  │  ├─ (app)/proyectos/nuevo/page.tsx
│  │  ├─ (app)/proyectos/[id]/page.tsx
│  │  ├─ (app)/proyectos/[id]/editar/page.tsx
│  │  ├─ (app)/proyectos/actions.ts
│  │  ├─ (app)/calendario/page.tsx
│  │  ├─ (app)/cuenta/page.tsx
│  │  ├─ (app)/cuenta/actions.ts
│  │  ├─ 403/page.tsx
│  │  ├─ not-found.tsx
│  │  └─ error.tsx
│  ├─ components/
│  │  ├─ ui/                  # Button, Tag, Field, Input, Select, Textarea, Seg, Card, Dialog, Table, Toast, ThemeSwitch, Avatar, StatusDot
│  │  ├─ layout/              # Sidebar, AppHeader, PageHeader
│  │  └─ projects/            # SummaryCard, ProjectCard, ProjectRow, ProjectFilters, ProjectForm, CredentialRow, PaymentList, NoteLog, LinkList, EmptyState, SessionExpiredDialog
│  ├─ lib/
│  │  ├─ supabase/{server,client,middleware}.ts
│  │  ├─ data/{projects,payments,notes,credentials,profile}.ts
│  │  ├─ crypto.ts            # encrypt/decrypt AES-256-GCM (solo servidor)
│  │  ├─ domain.ts            # enums, labels y colores por estado
│  │  ├─ schemas.ts           # Zod
│  │  ├─ format.ts            # moneda PEN y fechas es-PE
│  │  ├─ icons.ts
│  │  └─ database.types.ts    # generado
│  ├─ styles/{tokens.css,globals.css}
│  └─ middleware.ts           # refresco de sesión y redirección a /login
├─ tests/{unit,e2e}/
├─ .env.example
├─ CLAUDE.md
├─ tailwind.config.ts
└─ next.config.ts
```

## 3. Páginas (sitemap)

| Ruta | Tipo | Contenido | Datos |
|---|---|---|---|
| `/login` | pública | Hero en degradado y "Continuar con Google" | — |
| `/` | privada | Saludo, 3 `SummaryCard` (entregas próximas, por vencer, pagos pendientes), proyectos recientes | `getSummary(uid)` |
| `/proyectos` | privada | `ProjectFilters` (búsqueda, estado, stack, CMS), switch tarjetas/tabla, "Nuevo proyecto" | `listProjects(uid, filters)` |
| `/proyectos/nuevo` | privada | `ProjectForm` vacío | — |
| `/proyectos/[id]` | privada | Ficha: cabecera con miniatura, stack, enlaces, accesos, pagos, vencimientos, bitácora | `getProject(uid, id)`; si no es tuyo → 403 |
| `/proyectos/[id]/editar` | privada | `ProjectForm` prellenado | ídem |
| `/calendario` | privada | Entregas y vencimientos por mes | `listDeadlines(uid, month)` |
| `/cuenta` | privada | Perfil de Google, preferencias (nombre, carpeta base, tema, acento, fondo), exportar JSON, borrar cuenta | `getProfile(uid)` |
| `/403` | privada | `ErrorScreen` "No tienes acceso a este proyecto" | — |
| 401 | diálogo | `SessionExpiredDialog` encima de la app, con "Entrar de nuevo con Google" | — |

## 4. Componentes y contratos de props

```ts
// ui
type ButtonProps = { variant?: 'primary'|'secondary'|'ghost'; size?: 'sm'|'md'; tone?: 'default'|'danger'; icon?: IconName; loading?: boolean } & ButtonHTMLAttributes<HTMLButtonElement>
  & ({ iconOnly?: false; children: ReactNode } | { iconOnly: true; icon: IconName; 'aria-label': string }); // + buttonClass() para <Link>
type TagProps = { tone?: 'accent'|'accent-2'|'neutral'|'outline'; children: ReactNode };
type FieldProps = { label: string; htmlFor: string; error?: string; hint?: string; children: ReactNode };
type SegProps<T extends string> = { name: string; label: string; value: T; options: { value: T; label: string; icon?: IconName }[]; onChange(v: T): void };
type CardProps = { elevation?: 'sm'|'md'|'lg'; featured?: boolean; children: ReactNode } & ({ as?: 'div'|'article' } | { as: 'a'; href: string }); // 'a' usa next/link
type DialogProps = { open: boolean; title: string; onClose(): void; children: ReactNode; actions?: ReactNode }; // <dialog> nativo + showModal(); Esc y clic en el fondo llaman a onClose
type ToastProps = { message: string; icon?: IconName; aboveNav?: boolean };      // se muestra con useToast().show(message, icon?) dentro de <ToastProvider aboveNav?> (aboveNav solo en el shell, por la BottomNav)
type ThemeSwitchProps = { theme: 'light'|'dark'; onToggle(): void; size?: 'sm'|'md' };
type AvatarProps = { name: string; src?: string; size?: 36|40|64 }; // tamaños del export
type StatusDotProps = { status: ProjectStatus };

// layout
type SidebarProps = { user: { name: string; email: string; avatarUrl?: string }; activeCount: number; initialExpanded: boolean }; // estado propio + cookie tf-side; activo por usePathname()
type PageHeaderProps = { title: string; description?: ReactNode; actions?: ReactNode }; // + switch de tema al final de las acciones (export)
// mobile (< 820px): AppHeader (marca) + BottomNav fija de 4 ítems; sin props

// projects
type SummaryCardProps = { title: string; icon: IconName; iconTone: 'featured'|'danger'|'yellow'; window: string; count: number; sub: string; featured?: boolean; items: { id: string; href: string; primary: string; secondary?: string; badge: string; tone: TagVariant }[] }; // armadas por homeCards(projects, today)
type ProjectCardProps = { project: Project };   // miniatura 16:10, nombre, "tipo · CMS", chips de stack (stackChips), cliente y StatusDot; un solo enlace a la ficha
type ProjectRowProps = { project: Project };    // fila de tabla (ui/Table); "Abrir" lleva el nombre oculto
// /proyectos: la vista va en la URL (?vista=tabla) con ViewSwitch; parseProjectView()
type ProjectFiltersProps = { value: ProjectFilters; stacks: string[]; cmsOptions: string[]; counts: Record<ProjectStatus|'todos', number> }; // escribe en la URL
type ProjectFormProps = { initial?: ProjectInput; action(input: ProjectInput): Promise<ActionResult<{ id: string }>> };
// projectSchema (src/lib/schemas.ts) valida el form (zodResolver) y saveProject(input, projectId) en el servidor; ProjectFormValues = z.input (texto), ProjectInput = z.output (normalizado). Error → { ok: false, error, fieldErrors: { campo: mensaje } }. cms es texto libre (el select ofrece CMS_OPTIONS).
type CredentialRowProps = { projectId: string; credential: { id: string; label: string; username: string | null; url: string | null } }; // sin secreto; "Mostrar"/"Copiar" llaman a revealCredential({ projectId, credentialId }) → ActionResult<{ secret }> (src/lib/action-result.ts)
type PaymentListProps = { total: number; payments: Payment[]; onAdd(p: PaymentInput): Promise<ActionResult> };
type NoteLogProps = { notes: Note[]; onAdd(n: NoteInput): Promise<ActionResult>; onDelete(id: string): Promise<ActionResult> }; // borrar con confirmación en la misma línea
// T11b: NoteLog({ initialNotes, today }) vive en estado local; onAdd/onDelete pasan a Server Actions con la base
type LinkListProps = { links: Partial<Record<'repo'|'deploy'|'design'|'cms'|'panel', string>> };
// /proyectos/[id]: la pestaña va en la URL (?tab=resumen|cliente|stack|…), parseProjectTab(); externalHref() solo acepta http(s)
type EmptyStateProps = { title: string; body?: string; action?: ReactNode };
```

## 5. Modelo de datos (Postgres / Supabase)

```sql
create type project_status as enum ('en_desarrollo','revision','produccion','mantenimiento','archivado');
create type project_type   as enum ('landing','ecommerce','dashboard','institucional','webapp','otro');
create type note_kind      as enum ('pedido','cambio','nota');

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null,
  avatar_url text,
  base_path text,                         -- carpeta local base, ej. C:\proyectos
  theme text not null default 'light' check (theme in ('light','dark')),
  accent text not null default 'naranja',
  bg_variant text not null default 'pizarra',
  created_at timestamptz not null default now()
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users on delete cascade default auth.uid(),
  code text not null,                     -- ej. AGB-2026
  name text not null,
  client text not null,
  client_contact text, client_email text, client_whatsapp text, client_country text, -- pestaña Cliente (export)
  type project_type not null,
  status project_status not null default 'en_desarrollo',
  is_demo boolean not null default false, -- proyectos ficticios "(F)"
  description text,
  start_date date,
  delivery_date date,
  stack_frontend text[] not null default '{}',
  stack_backend  text[] not null default '{}',
  stack_db       text[] not null default '{}',
  stack_hosting  text[] not null default '{}',
  cms text,
  local_path text,
  link_repo text, link_deploy text, link_design text, link_cms text, link_panel text,
  domain_name text, domain_expires date, hosting_expires date,
  domain_pending boolean not null default false, -- dominio por comprar ("Comprar" en Por vencer)
  budget_pen numeric(10,2) check (budget_pen >= 0),
  thumbnail_path text,                    -- Supabase Storage: thumbnails/{owner}/{id}.webp
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, code)
);
create index on projects (owner_id, status);
create index on projects using gin (to_tsvector('spanish', name || ' ' || client || ' ' || code));

create table payments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects on delete cascade,
  owner_id uuid not null default auth.uid(),
  amount_pen numeric(10,2) not null check (amount_pen > 0),
  paid_on date not null,
  concept text,
  created_at timestamptz not null default now()
);

create table notes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects on delete cascade,
  owner_id uuid not null default auth.uid(),
  kind note_kind not null,
  body text not null,
  noted_on date not null default current_date,
  created_at timestamptz not null default now()
);

create table credentials (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects on delete cascade,
  owner_id uuid not null default auth.uid(),
  label text not null,                    -- ej. "Sanity Studio"
  url text,
  username text,
  secret_ciphertext bytea not null,       -- AES-256-GCM
  secret_iv bytea not null,
  secret_tag bytea not null,
  key_version smallint not null default 1,
  created_at timestamptz not null default now()
);
```

**RLS (en todas las tablas):**

```sql
alter table projects enable row level security;
create policy "dueño" on projects for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
-- misma política en payments, notes y credentials; en profiles: id = auth.uid()
```

**Otros elementos de la base:**
- Trigger `handle_new_user`: crea el `profile` desde `raw_user_meta_data` de Google la primera vez que el usuario entra.
- Trigger `updated_at` en `projects`.
- Vista `project_summary`: total pagado, saldo y días a la entrega. Se usa en el Home y en las tarjetas.

## 6. Capa de datos y API

- **Lecturas:** funciones en `src/lib/data/*.ts`, llamadas desde Server Components con el cliente de servidor de `@supabase/ssr`. Devuelven tipos de dominio, no filas crudas.
- **Escrituras:** Server Actions (`actions.ts`).
  - Flujo: validar con Zod → llamar a `data/*` → `revalidatePath` → devolver `ActionResult`.
- **Búsqueda y filtros:** viven en `searchParams` (`?q=&estado=&stack=&cms=&vista=tabla`). Se aplican en el servidor (`ilike` o full text).
- **Contenido editable:** todo está en Postgres y es editable desde la UI. No hay CMS externo.
- **Miniaturas:** se suben a Supabase Storage (bucket privado `thumbnails` con política por dueño). Se sirven con URL firmada y `next/image`, en 1600×1000 y 16:10.
- **Exportar datos:** la Server Action `exportData()` devuelve un JSON con proyectos, pagos y notas. Las credenciales van **sin** el secreto.
- **Borrar cuenta:** una Server Action con `service_role` borra `auth.users`, y por cascada desaparece todo lo del usuario.

## 7. Autenticación y credenciales sensibles

**Login:**
1. "Continuar con Google" llama a `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: /auth/callback } })`.
2. `/auth/callback` intercambia el código por la sesión, que queda en cookies httpOnly gestionadas por `@supabase/ssr`.
3. `middleware.ts` refresca la sesión en cada request. Si no hay sesión, redirige a `/login`.
4. **401:** si una Server Action recibe un JWT expirado y el refresh falla, devuelve `{ error: 'unauthorized' }` y la UI abre `SessionExpiredDialog`.
5. **403:** `getProject` devuelve `null` por RLS. Si el id existe pero no es tuyo (comprobado con una función `security definer` que solo devuelve un booleano), redirige a `/403`; si no existe, va a `notFound()`.

**Credenciales de clientes:**
- Se cifran en `src/lib/crypto.ts` (solo servidor) con AES-256-GCM.
  - IV aleatorio de 12 bytes por secreto.
  - Clave de 32 bytes desde `CREDENTIALS_KEY` (base64).
  - `key_version` para poder rotar la clave.
- Para verlas: la Server Action `revealCredential(id)` comprueba la sesión, lee el secreto (RLS), lo descifra y lo devuelve solo a ese request. La UI lo muestra 30 s y luego lo oculta. Hay botón de copiar.
- Nunca se guardan en logs ni en Sentry: se agrega un `beforeSend` que limpia los campos `secret*`.

## 8. Variables de entorno

| Variable | Dónde | Pública |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | cliente y servidor | sí |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | cliente y servidor | sí (protegida por RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | solo servidor (borrar cuenta) | **no** |
| `CREDENTIALS_KEY` | solo servidor | **no** |
| `CREDENTIALS_KEY_PREVIOUS` | solo durante una rotación | **no** |
| `NEXT_PUBLIC_SITE_URL` | redirect de OAuth | sí |
| `SENTRY_DSN` (fase 2) | servidor | no |

- Google OAuth (client id y secret) se configura en el **dashboard de Supabase**, no en el repo.
- `.env.local` está en `.gitignore`. `.env.example` lista las claves vacías.
- En Vercel, los valores de Preview y Production van separados, con un proyecto de Supabase distinto para cada uno.

## 9. Pruebas que demuestran nivel

- **Unitarias:** `crypto.ts` (ida y vuelta, y que falle si se manipula el tag), `schemas.ts` y `format.ts`.
- **Integración:** políticas de RLS con dos usuarios de prueba (A no puede leer ni escribir lo de B).
- **e2e (Playwright):**
  - Login con la sesión mockeada → crear proyecto → filtrar → ver detalle → agregar pago y nota → borrar nota.
  - El mismo flujo en mobile a 375px.
