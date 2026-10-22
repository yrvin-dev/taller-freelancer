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
| `/cuenta` | privada | Perfil de Google, preferencias (nombre, carpeta base y tema; acento y fondo en fase 2), exportar JSON (`GET /cuenta/exportar`, sin credenciales), borrar cuenta | `getProfile(uid)`, `savePreferences` (al salir del campo) |
| `/403` | privada | `ErrorScreen` "No tienes acceso a este proyecto" | — |
| 401 | diálogo | `SessionExpiredDialog` encima de la app, con "Entrar de nuevo con Google" | — |
| 404 | `not-found.tsx` | `ErrorScreen` 404: en `(app)/` con el shell (`notFound()` de una ficha) y en la raíz sin él (URL inexistente) | — |
| error | `(app)/error.tsx` | `ErrorScreen` "Algo salió mal" con "Reintentar" (`reset`); solo registra el digest | — |

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

✅ T14 · Implementado en `supabase/migrations/` (fuente de verdad del esquema; este bloque es el resumen). Diferencias con lo de arriba:
- Políticas **por operación** (select/insert/update/delete), solo `to authenticated`, con `(select auth.uid())`. `anon` sin ningún permiso en `public`.
- Las tablas hijas (`payments`, `notes`, `credentials`) tienen una **FK compuesta** `(project_id, owner_id) → projects(id, owner_id)`: la base impide colgar filas en un proyecto ajeno aunque falle una política.
- `check` de largo y formato en la base, iguales a Zod (`code ~ '^[A-Z0-9-]{1,20}$'`, nombre ≤ 120, nota ≤ 2000…).
- `profiles.bg_variant` por defecto `arena` (T02) y `accent`/`bg_variant` con `check` de los valores de `tokens.css`.
- `touch_project`: un pago, nota o credencial nueva actualiza `projects.updated_at` ("Actualizado" de recientes). Es `security definer` (T14b): al borrar un usuario, Supabase Auth corre como `supabase_auth_admin`, que no tiene permisos sobre `projects`.
- `project_summary` (`security_invoker`): `paid_pen` y `balance_pen`. Los días a la entrega se calculan en la app con la hora de Lima.
- Test: `pnpm test:integration` (dos usuarios reales en la Supabase local; con RLS apagado, falla).

**Otros elementos de la base:**
- Trigger `handle_new_user`: crea el `profile` desde `raw_user_meta_data` de Google la primera vez que el usuario entra.
- Trigger `updated_at` en `projects`.
- Vista `project_summary`: total pagado, saldo y días a la entrega. Se usa en el Home y en las tarjetas.

## 6. Capa de datos y API

- ✅ T20b · Pagos: `addPayment` (Zod con `paymentInputSchema`: monto > 0, fecha no futura en Lima; luego lee el proyecto con RLS y rechaza si no tiene monto total o si el pago supera el saldo, en céntimos) y `deletePayment`. No hace falta migración: la tabla ya tenía RLS, FK compuesta y `touch_project`. El saldo se revisa en la acción, no en la base: dos pagos simultáneos podrían pasarse del saldo (aceptable para un usuario; si hiciera falta, iría en una función `rpc` con bloqueo). La UI usa `useOptimistic` (`PaymentsPanel`, `NoteLog`).
- ✅ T16b · Escrituras: `saveProject` (crear con primer pago y primera nota; si fallan, se borra el proyecto recién creado; código automático con sufijo si se repite; código escrito duplicado → `fieldErrors.code`), `deleteProject`, `archiveProject`, `addNote`, `deleteNote`. Todas: Zod → sesión → query con RLS → `revalidatePath`. Una fila ajena no aparece (0 filas) y se responde con error. Probadas contra la base en `tests/integration/actions.test.ts`.
- ✅ T16a · `listProjects()` y `getProject(id)` (`cache()`), con `PROJECT_SELECT` y `toProject()` en `project-mapper.ts`. Las credenciales se piden **sin** `secret_*`. `getProject` devuelve `ok | forbidden | not-found` usando `project_exists(id)` (`security definer`, solo un booleano); la ficha y la edición redirigen a `/403` o llaman a `notFound()`.
- ✅ T15b · Primera función: `getCurrentProfile()` (`src/lib/data/profile.ts`, `server-only`, envuelta en `cache()` para no repetir la consulta en el mismo pedido). El layout `(app)` redirige a `/login` si devuelve `null` (segunda barrera tras el middleware). `savePreferences` actualiza `profiles` con RLS.
- **Lecturas:** funciones en `src/lib/data/*.ts`, llamadas desde Server Components con el cliente de servidor de `@supabase/ssr`. Devuelven tipos de dominio, no filas crudas.
- **Escrituras:** Server Actions (`actions.ts`).
  - Flujo: validar con Zod → llamar a `data/*` → `revalidatePath` → devolver `ActionResult`.
- **Búsqueda y filtros:** viven en `searchParams` (`?q=&estado=&stack=&cms=&vista=tabla`). ✅ T19 · Se aplican en el servidor, **en memoria** sobre `listProjects()` (`src/lib/project-filters.ts`, funciones puras): con decenas de proyectos por usuario es una sola query, los contadores por estado salen gratis y la búsqueda ignora tildes sin extensiones de Postgres. Si un usuario llegara a miles, se pasa a SQL (`ilike` o full text con `unaccent`) sin cambiar la URL. Los valores inválidos de la URL se ignoran (quedan en "Todos").
- **Contenido editable:** todo está en Postgres y es editable desde la UI. No hay CMS externo.
- **Miniaturas:** se suben a Supabase Storage (bucket privado `thumbnails` con política por dueño). Se sirven con URL firmada y `next/image`, en 1600×1000 y 16:10.
- **Exportar datos:** la Server Action `exportData()` devuelve un JSON con proyectos, pagos y notas. Las credenciales van **sin** el secreto.
- **Borrar cuenta:** una Server Action con `service_role` borra `auth.users`, y por cascada desaparece todo lo del usuario. ✅ T18 · `deleteAccount()` (sin argumentos: el id sale de la sesión) usa `createSupabaseAdminClient()` (`src/lib/supabase/admin.ts`, `server-only`), cierra la sesión y redirige a `/login?cuenta=borrada`. Probado: no queda ninguna fila del usuario en ninguna tabla.

## 7. Autenticación y credenciales sensibles

**Login:**
1. "Continuar con Google" llama a `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: /auth/callback } })`.
2. `/auth/callback` intercambia el código por la sesión, que queda en cookies httpOnly gestionadas por `@supabase/ssr`.
3. `middleware.ts` refresca la sesión en cada request. Si no hay sesión, redirige a `/login`.
   ✅ T15a · Implementado: `src/lib/supabase/{server,client,middleware}.ts` (solo clave pública), `src/middleware.ts` (sin sesión → `/login?next=…`; con sesión, `/login` → `/`), `/auth/callback` (canje del código) y `/auth/signout` (solo POST, 303). "Continuar con Google" es un formulario con la Server Action `signInWithGoogle`. `next` pasa por `safeNextPath` (solo rutas internas: sin *open redirect*). Las variables públicas se validan con Zod en `src/lib/env.ts`.
4. **401:** si una Server Action recibe un JWT expirado y el refresh falla, devuelve `{ error: 'unauthorized' }` y la UI abre `SessionExpiredDialog`.
   ✅ T21a · El middleware **no** redirige los pedidos de Server Actions (POST con `Next-Action`, `isServerActionRequest`): si lo hiciera, la acción nunca respondería 401 y el diálogo no se abriría (lo encontró la auditoría en el navegador). No abre nada: cada acción valida la sesión y RLS protege los datos.
   ✅ T20a · Todas devuelven `SESSION_EXPIRED` (`src/lib/action-result.ts`: `{ ok: false, error, code: 'unauthorized' }`). Los componentes pasan cada error por `useActionFeedback().fail(result)`: con `code` abre el diálogo, si no, toast. Las navegaciones sin sesión las sigue cortando el middleware (→ `/login?next=…`).
5. **403:** `getProject` devuelve `null` por RLS. Si el id existe pero no es tuyo (comprobado con una función `security definer` que solo devuelve un booleano), redirige a `/403`; si no existe, va a `notFound()`.

**Credenciales de clientes:**
- ✅ T17b · Rotación: `pnpm rotate-key [--dry-run]` (`scripts/rotate-key.ts` → `src/lib/credentials-rotation.ts`). Con `CREDENTIALS_KEY_PREVIOUS` (clave actual), `CREDENTIALS_KEY` (nueva) y `CREDENTIALS_KEY_VERSION` (+1) re-cifra las filas de la versión anterior, deja intactas las que no se descifran (las reporta por id) y es idempotente. Usa `service_role`: es la tarea de admin documentada de la regla 5. Mientras dura, la app lee ambas versiones.
- ✅ T17a · Implementado en `src/lib/crypto.ts` + `src/lib/env-server.ts` (claves por versión, validadas con Zod). AAD = `taller-freelancer:credential:v1:{owner_id}:{project_id}`: copiar un cifrado a otra fila hace fallar el descifrado. En PostgREST el `bytea` viaja como `\x` + hex. `revealCredential` lee con RLS y solo registra el id si falla. Se agregan y borran desde Accesos (diálogo), nunca por el formulario del proyecto.
- Se cifran en `src/lib/crypto.ts` (solo servidor) con AES-256-GCM.
  - IV aleatorio de 12 bytes por secreto.
  - Clave de 32 bytes desde `CREDENTIALS_KEY` (base64).
  - `key_version` para poder rotar la clave.
- Para verlas: la Server Action `revealCredential(id)` comprueba la sesión, lee el secreto (RLS), lo descifra y lo devuelve solo a ese request. La UI lo muestra 30 s y luego lo oculta. Hay botón de copiar.
- Nunca se guardan en logs ni en Sentry: se agrega un `beforeSend` que limpia los campos `secret*`.

**Cabeceras de seguridad y CI:**
- ✅ T23a · CSP con nonce por pedido (`src/lib/security-headers.ts`, aplicada en `src/middleware.ts`): `script-src 'self' 'nonce-…' 'strict-dynamic'` (sin `unsafe-inline` ni `unsafe-eval`; solo en dev se suma `unsafe-eval`), `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'self'`, `form-action` (Supabase y Google, por la cadena del OAuth sin JS), `img-src` y `connect-src` con el origen de Supabase. `style-src` lleva `'unsafe-inline'` por los `style` de `next/image`. El nonce va en la cabecera **del pedido** antes de `updateSession` (Next lo lee de ahí) y en todas las respuestas, redirecciones incluidas. Fijas en `next.config.ts`: `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` y HSTS. `tests/e2e/csp.spec.ts` recorre todas las rutas y falla ante cualquier violación.
- ✅ T23a · `.github/workflows/ci.yml`, en cada PR y push a `main`. Job `quality`: lint, typecheck, formato, `check:tokens`, unitarios y `pnpm audit --prod --audit-level high`. Job `e2e`: Supabase local en el runner (solo Postgres, Auth, PostgREST y Kong), comprobación de que `database.types.ts` coincide con las migraciones, `.env.local` armado desde `supabase status` con una `CREDENTIALS_KEY` aleatoria por corrida, integración y e2e (que compila el build). Si falla, sube el reporte de Playwright. Dependabot semanal para npm y Actions.

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
- ✅ T21b · **Lighthouse:** `pnpm a11y:lighthouse` (`scripts/lighthouse-a11y.mts`) mide el build de los e2e (`pnpm e2e:build && pnpm e2e:start`, puerto 3100; se niega a correr contra `pnpm dev`) en las mismas rutas que axe (`tests/e2e/routes.ts`), en light y dark, perfil mobile y desktop: 68 corridas, un Chromium limpio por corrida y un reintento solo si se cae la conexión. Falla si algo da menos de 100 o si falla alguna auditoría aunque no pese en el puntaje.
- ✅ T21a · **Accesibilidad en navegador real (Playwright + axe):** `pnpm test:a11y` corre `tests/e2e/a11y.spec.ts` (axe WCAG 2.2 A/AA en todas las rutas, el login, la sidebar expandida y los diálogos de eliminar, credencial, borrar cuenta y 401, en light y dark, a 1440 y 375) y `tests/e2e/keyboard.spec.ts` (foco visible al tabular; un diálogo se abre con Enter, Esc lo cierra y el foco vuelve al botón; el 401 no se cierra; todo lo tocable mide ≥ 44px en mobile). `auth.setup.ts` entra como el usuario demo local con `@supabase/ssr` (sin Google); las cookies quedan en `tests/e2e/.auth/` (ignorado). Solo contra la Supabase local.
- ✅ T22 · **e2e (Playwright):** `pnpm test:e2e` compila su propio build de producción (`.next-e2e`, puerto 3100: no choca con `pnpm dev`) y corre todo en desktop (1440) y mobile (375) contra la Supabase local.
  - `project-flow.spec.ts`: sesión demo → crear proyecto con adelanto → buscar y filtrar (la URL conserva los filtros tras recargar) → ficha → pago (y el rechazo por superar el saldo) → nota y borrarla → credencial (el secreto no está en el HTML, solo tras "Mostrar") → eliminar. Cada corrida usa su proyecto `E2E-…` y lo borra aunque falle.
  - `auth.spec.ts`: sin sesión, una ruta privada lleva a `/login?next=…`; con sesión, `/login` lleva al inicio y un proyecto inexistente responde 404.
  - Encontró tres bugs que solo se veían en un navegador real: filtros que se pisaban si cambiabas otro antes de la respuesta, el pago que viajaba ya transformado, y la navegación por pestañas/vista colgada en producción por los `loading.tsx` (ver gotchas de CLAUDE.md).
