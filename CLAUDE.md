# CLAUDE.md — Taller Freelancer

> Cerebro del proyecto. Léelo entero antes de cada tanda.
> Specs: `01-requerimientos.md` (qué) · `02-design-system.md` (cómo se ve) · `03-arquitectura.md` (cómo se construye) · `04-plan.md` (en qué orden).

## Qué es

Dashboard web para que freelancers administren sus proyectos de cliente: stack, accesos, enlaces, pagos, vencimientos y bitácora. Es multiusuario con login de Google, y cada usuario ve solo sus datos. No hay roles en el MVP.
Además de herramienta personal, es una **pieza de portafolio**: el código tiene que leerse como el de un senior (tipado estricto, tests y CI, seguridad bien resuelta).

## Stack y por qué

| Capa | Herramienta | Por qué |
|---|---|---|
| Framework | **Next.js 15 (App Router) + React 19 + TypeScript strict** | App detrás de login, muy interactiva. Server Components y Server Actions evitan una API aparte. Es lo que más piden las ofertas de frontend y full stack. |
| Estilos | **Tailwind CSS v3.4** mapeado a CSS vars | Los tokens del export se usan tal cual. Tailwind solo referencia `var(--*)`. |
| Datos y auth | **Supabase**: Postgres + Auth (Google OAuth) + RLS + Storage | Auth y base de datos listos. La autorización vive en la base (RLS), así que aunque falle el frontend nadie lee datos ajenos. |
| Acceso a datos | `@supabase/ssr` + tipos generados (`supabase gen types`) | Queries tipadas de punta a punta. |
| Validación | **Zod** (compartido entre form y server action) | Un solo esquema para el cliente y el servidor. |
| Formularios | React Hook Form + `@hookform/resolvers/zod` | |
| Estado en el cliente | Estado de URL (`searchParams`) para los filtros; nada de un store global | Filtros que se pueden compartir y que no se pierden al recargar. |
| Cifrado | AES-256-GCM con `node:crypto` en el servidor, clave en `CREDENTIALS_KEY` | Las credenciales de clientes nunca llegan en claro a la base. |
| Tests | **Vitest** + Testing Library (unitarios) · **Playwright** (e2e) | |
| Calidad | ESLint (con una regla que prohíbe hex) · Prettier · `tsc --noEmit` | |
| CI/CD | GitHub Actions (lint, typecheck, tests y build) → Vercel (previews por PR, producción en `main`) | |
| Observabilidad | Vercel Analytics · Sentry (fase 2) | |

> Se descartó **Astro**: no aporta SEO detrás de un login y todo terminaría como isla. Se descartó **Spring Boot**: el Java del portafolio va en el proyecto de la clínica dental, donde tiene reglas de negocio de verdad.

## Reglas duras

1. **Cero valores hex o rgb fuera de `src/styles/tokens.css`.** Todo color, sombra y radio sale de `var(--*)` o de una clase de Tailwind mapeada a un token. ESLint y un `grep` en CI lo bloquean.
2. **Los componentes se portan del export** (`Taller Freelancer.dc.html`), nunca se inventan. Si falta uno, se agrega primero al export o al 02, y después se porta.
3. **Fuente única de verdad:**
   - Tokens → `src/styles/tokens.css`.
   - Íconos → `src/lib/icons.ts`.
   - Estados, tipos y labels → `src/lib/domain.ts`.
   - Esquemas → `src/lib/schemas.ts`.
   - Tipos de la base → `src/lib/database.types.ts` (generado, no se edita a mano).
4. **Espaciado solo con tokens existentes** (`--space-1/2/3/4/6/8`). No existen `space-5` ni `space-10`.
5. **Toda query pasa por RLS.** Nunca se usa la `service_role` key en código que corra en el navegador, y en el servidor solo para tareas de admin documentadas.
6. **Las credenciales se descifran solo en el servidor** y solo cuando el usuario pide verlas (botón "Mostrar"). Nunca van en logs ni en el HTML inicial.
7. **TypeScript strict, sin `any`.** Se puede usar `unknown` y validar con Zod.
8. **Accesibilidad AA**: contraste de 4.5:1, foco visible, objetivos táctiles de 44px en mobile y labels en todos los inputs.

## Método por tandas (obligatorio)

Una tanda es una unidad de trabajo cerrada:

1. **Prompt acotado**: una tanda del `04-plan.md`, por ID (por ejemplo `T03`).
2. **Plan**: Claude lista los archivos que va a crear o tocar y qué cambia en cada uno. No se escribe código todavía.
3. **Aprobación**: en *manual mode*, cada edición se aprueba por separado.
4. **Verificación por código**: `pnpm lint && pnpm typecheck && pnpm test`.
5. **Verificación visual**: abrir en el navegador (`pnpm dev`), comparar con el export en light y dark, y en 375px y 1440px.
6. **Commit atómico**: `git add <archivos explícitos>` y luego `git commit -m "T03: …"`. **Nunca `git add .` ni `git add -A`.**
7. Actualizar la casilla de la tanda en `04-plan.md` y, si salió algo nuevo, la sección *Gotchas*.

**Prohibido encadenar tandas.** Al terminar una se para y se espera el siguiente prompt. Si una tanda crece, se parte en `T03a` y `T03b`.

## Orden de construcción

Ver `04-plan.md`. Resumen: scaffold y tokens → componentes base → layout → páginas → datos y auth → interactividad → accesibilidad → deploy.

## Convenciones

- Carpetas y archivos en `kebab-case`; componentes en `PascalCase.tsx`.
- Server Components por defecto. `"use client"` solo donde hay estado o eventos.
- Server Actions en `src/app/(app)/**/actions.ts`, siempre validadas con Zod y devolviendo `{ ok, error }`.
- Commits: `T<nn>: <verbo> <qué>` (por ejemplo `T05: porta ProjectCard desde el export`).
- La UI va en español (es-PE), los montos en soles (`Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' })`) y las fechas con `Intl.DateTimeFormat('es-PE')`.

## Seguridad

- **Credenciales de clientes y secretos nunca a git.** `.env*` está en `.gitignore` (excepto `.env.example`, que solo tiene claves vacías).
- Las credenciales se guardan cifradas con AES-256-GCM. La clave `CREDENTIALS_KEY` vive solo en Vercel (Production y Preview separadas) y en tu `.env.local`.
- Si una clave se filtra: rotarla y re-cifrar los datos con el script `scripts/rotate-key.ts`.
- `pnpm audit` y Dependabot activos. Antes de cada commit, revisa en el diff que no haya tokens ni URLs con credenciales.
- Cabeceras de seguridad en `next.config.ts`: CSP, `X-Frame-Options: DENY` y `Referrer-Policy`.

## Gotchas / aprendizajes

<!-- Agregar una línea por aprendizaje: fecha · tanda · qué pasó · regla nueva -->
- 2026-10-15 · T01 · En `/mnt/c` (disco de Windows desde WSL) Vitest + jsdom no arranca (worker > 60s); en ext4 tarda 2s. **El repo vive en `~/proyectos/`, nunca en `/mnt/c`.**
- 2026-10-15 · T01 · ESLint 9 usa flat config (`eslint.config.mjs` + `FlatCompat` para `next/*`). `pnpm lint` corre `eslint .`, no `next lint` (deprecado en Next 15.5).
- 2026-10-15 · T01 · pnpm bloquea los scripts de postinstall por defecto: `unrs-resolver` está permitido en `pnpm-workspace.yaml` (`allowBuilds`).
- 2026-10-15 · T02 · En App Router, una carpeta `_algo` es **privada** y no genera ruta. Para una URL `/_tokens`, la carpeta se llama `%5Ftokens`.
- 2026-10-15 · T02 · Los tokens que referencian a otros (`--status-dev: var(--color-accent)`) van bajo `[data-theme]`, no en `:root`: una custom property se resuelve donde se declara y se hereda ya resuelta, así que en `:root` ignoraría el tema de un contenedor anidado.
- 2026-10-15 · T02 · La regla `no-hex` (`no-restricted-syntax`) aplica solo a `src/**`; los tests que usan hex como fixture quedan fuera. El CSS se cubre con `pnpm check:tokens` (grep).
- 2026-10-16 · T03 · UIcons 2.6 no existe en npm (salta de 2.4.0 a 3.0.0): se usa `@flaticon/flaticon-uicons@3.3.1`, importando solo `regular/rounded`, `solid/rounded` y `brands/all` en `layout.tsx`. Sus selectores solo aplican a `<i>` y `<span>`.
- 2026-10-16 · T03 · Las fechas `YYYY-MM-DD` se parsean en hora local con `parseDate` (`format.ts`). `new Date('2026-10-05')` es UTC y en Lima muestra el día anterior.
- 2026-10-16 · T03 · `Intl` en es-PE: el monto lleva un espacio duro U+00A0 entre `S/` y la cifra, y septiembre se abrevia "set." (no "sep" como en el export). En los tests, compara usando la constante `NBSP` de `format.test.ts`, no un espacio normal.
- 2026-10-16 · T04 · En Tailwind 3, `@layer base` no es una capa nativa de CSS: gana la especificidad. `a:hover` (0,1,1) le gana a `.text-text` (0,1,0), así que un componente que se renderiza como `<a>` necesita también `hover:text-*`.
- 2026-10-16 · T04 · No mezclar en la misma clase dos utilidades que tocan la misma propiedad (`px-1` y `px-[…]`, `font-semibold` y `font-bold`): gana la que Tailwind genera después, no la que va última en el string. Se resuelve eligiendo una sola en código (ver `buttonClass`).
- 2026-10-16 · T04 · Los valores de espaciado del export que no son tokens (6px, 3px, 18px) se escriben como el export: `calc(var(--space-*) * n)` en un valor arbitrario. Los tamaños fijos (36px, 7px, 44px) van en px.
- 2026-10-16 · T05a · `pnpm dev` no recarga los cambios de `tailwind.config.ts` (colores nuevos): las clases no se generan hasta reiniciar el servidor. Tras tocar la config, reiniciar `pnpm dev` antes de la revisión visual.
- 2026-10-16 · T05a · No correr `pnpm build` con `pnpm dev` levantado: los dos usan `.next` y se pisan.
- 2026-10-16 · T05b · jsdom no implementa `<dialog>.showModal()`: `vitest.setup.ts` tiene un polyfill mínimo (atributo `open` y evento `close`). El foco atrapado y el fondo inerte solo se pueden probar en e2e (Playwright).
- 2026-10-16 · T05b · `::backdrop` hereda las custom properties del `<dialog>` solo en navegadores recientes (Chrome 122+, Safari 17.4+, Firefox 120+). En uno anterior, `backdrop:bg-backdrop` queda transparente: el diálogo sigue funcionando, solo pierde el oscurecido.
- 2026-10-16 · T06 · El tema vive en la cookie `tf-theme`, que lee el layout raíz con `cookies()`, así que todas las rutas se renderizan en el servidor en cada pedido (`ƒ` en el build, no `○`). Es a propósito: es lo que evita el parpadeo sin un script inline (que chocaría con la CSP).
- 2026-10-16 · T06 · `ThemeSwitch` recibe `onToggle`: un Server Component no le puede pasar una función. Se usa desde un Client Component con `useTheme()` (ver `HomeThemeSwitch`).
- 2026-10-16 · T07a · Al mover o borrar una página, `tsc` puede fallar por tipos viejos en `.next/types/app/…` (el `tsconfig` los incluye). Se borra el archivo viejo o se corre `pnpm build` para regenerarlos.
- 2026-10-16 · T07a · El nombre accesible se arma juntando los nodos sin agregar espacios, y el espacio inicial dentro de un `sr-only` se pierde: `5<span class="sr-only"> activos</span>` se lee "5activos". El espacio va como nodo de texto aparte: `{n}{' '}<span className="sr-only">activos</span>`.
- 2026-10-16 · T07a · Las transiciones encadenadas de la sidebar viven en `globals.css` (`.sidebar*` guiadas por `data-expanded`) y no en estilos inline, para que `prefers-reduced-motion` las pueda apagar.
- 2026-10-16 · T07b · `env(safe-area-inset-bottom)` vale 0 si el viewport no tiene `viewport-fit=cover` (en `layout.tsx`, `export const viewport`). La BottomNav, el padding inferior de `<main>` y el toast lo suman.
- 2026-10-16 · T08 · El login no porta el selector de cuentas de Google del export: era una simulación del prototipo. Con OAuth real, Google muestra su propia pantalla y vuelve a `/auth/callback`; replicar la interfaz de Google dentro de la app no corresponde.
- 2026-10-16 · T09a · Las miniaturas del mock se pasaron a WebP con `sharp` (desde T24a es dependencia directa, en la misma versión que trae Next). Antes de publicar una imagen en `public/`, hay que mirarla: la captura de "Dashboard freelance" del export era del navegador del autor (pestañas y URL privada de claude.ai) y no se publicó.
- 2026-10-16 · T09a · Los montos se suman en céntimos enteros (`paidPen`, `totalBalance`) para evitar errores de coma flotante (`0.1 + 0.2`).
- 2026-10-16 · T09b · "Hoy" se calcula en Lima (`todayIn()`, `hourIn()`, `toISODateIn()` en `format.ts`), nunca con `new Date()` a secas: Vercel corre en UTC y entre las 19:00 y las 24:00 de Lima ya sería el día siguiente (badges y "Actualizado" corridos un día).
- 2026-10-16 · T09b · `getByText` normaliza los espacios del DOM (el espacio duro U+00A0 de `Intl` pasa a ser un espacio normal) pero no el texto buscado: en tests de componentes se busca `'S/ 14,100'` con un espacio normal. En tests de `format.ts` (sin DOM) se compara con la constante `NBSP`.
- 2026-10-16 · T05c · Un color con transparencia (`color-mix(... 70%, transparent)`) cambia de contraste según el fondo que tenga debajo: el texto secundario va en sólidos de la rampa (`neutral-600/700`). Todo par de texto nuevo se mide en los 2 temas × 3 fondos; `tests/unit/contrast.test.ts` lee `tokens.css` y falla si se rompe el AA.
- 2026-10-16 · T10 · El primer `pnpm build` tras reiniciar la PC puede tardar más de 5 minutos (caché fría). Si se pasa a segundo plano, **no** levantar `pnpm dev` hasta que termine (comparten `.next`); comprobar con `pgrep -fa "[n]ext (build|dev)"`. Para matar procesos, usar el patrón `"[n]ext dev"`: con `"next dev"`, `pkill -f` también mata la propia shell.
- 2026-10-16 · T11a · En Next 15, `params` y `searchParams` de las páginas son `Promise`: se hace `await`. En los tests, la página se llama como función async (`await ProjectPage({ params: Promise.resolve(...) })`) y se renderiza el resultado; `notFound()` lanza un error, así que se prueba con `rejects.toThrow()`.
- 2026-10-16 · T11a · Los enlaces que escribe el usuario pasan por `externalHref()` (`links.ts`): agrega `https://` y rechaza otros esquemas (`javascript:`, `data:`). Los enlaces a otros sitios usan `ExternalLink` (`rel="noopener noreferrer"` y aviso para lectores de pantalla).
- 2026-10-16 · T11b · Los módulos con secretos llevan `import 'server-only'`: el build falla si llegan a un Client Component. En Vitest ese paquete lanza un error al importarse, así que `vitest.config.ts` lo apunta a `tests/stubs/server-only.ts`. Tras cada build se verifica que no se filtren: `grep -rl 'demo-' .next/static` debe dar 0.
- 2026-10-16 · T11b · Con React 19, `ref` es una prop: los controles se tipan con `ComponentProps<'input'>` (no `InputHTMLAttributes`, que no incluye `ref`). React Hook Form también lo necesita.
- 2026-10-16 · T11b · Para cambiar el tamaño de un control que ya trae ancho o alto (`Select` con `w-full`, `Textarea` con `min-h-[90px]`), no se le pasa otra clase del mismo tipo: se envuelve en un contenedor con el ancho o se agrega una prop (`compact`).
- 2026-10-17 · T12a · `projectSchema` transforma (texto a listas, vacío a `null`, montos a número), así que su entrada y su salida son tipos distintos: el formulario usa `z.input` (`ProjectFormValues`) y la base `z.output` (`ProjectInput`). Con RHF: `useForm<ProjectFormValues, unknown, ProjectInput>`.
- 2026-10-17 · T12b · `register()` de React Hook Form funciona sobre `Input`/`Select`/`Textarea` porque aceptan `ref` (T11b) y `Field` les pasa `id`, `aria-describedby` y `aria-invalid` por contexto. Los `fieldErrors` del servidor se pintan con `setError(name, { type: 'server', message })`.
- 2026-10-17 · T12b · Un botón de enviar fuera del `<form>` (la barra de arriba del formulario) usa el atributo `form="<id del form>"`.
- 2026-10-17 · T12b · pnpm aplica `minimumReleaseAge`: rechaza versiones publicadas hace menos de un día (protección contra ataques a la cadena de suministro). Si `pnpm add` agrega `minimumReleaseAgeExclude` a `pnpm-workspace.yaml`, **no se commitea**: se revierte y se elige una versión más antigua (`pnpm view <pkg> time --json`). Si el lockfile quedó con la versión rechazada, `git checkout -- package.json pnpm-lock.yaml` y se reinstala.
- 2026-10-17 · T13a · `Intl` en es-PE puede devolver el mes con mayúscula ("Octubre") según la versión de ICU: `formatMonthYear` normaliza a minúsculas y capitaliza solo si se pide.
- 2026-10-17 · T13a · `tests/unit/no-hex.test.ts` precalienta ESLint en `beforeAll` (30 s): la primera pasada carga la config completa y, con toda la suite en paralelo, pasaba de los 5 s por defecto.
- 2026-10-17 · T13a · Para omitir campos sensibles se usa `const { credentials, ...resto } = obj`; ESLint lo permite con `ignoreRestSiblings`. El export JSON nunca incluye credenciales (un archivo descargado no tiene RLS ni cifrado).
- 2026-10-17 · T13b · Una página de App Router siempre responde 200, así que `/403` es una pantalla, no un código HTTP (lo que lo aplica de verdad es RLS). `notFound()` sí responde 404. En dev, esas respuestas llegan en streaming: el árbol real (con o sin shell) se ve en el payload RSC o en el navegador, no contando etiquetas del HTML inicial.
- 2026-10-18 · T14 · Supabase local corre en Docker Desktop con la integración de WSL. Si `docker` dice "permission denied", la sesión se abrió antes de entrar al grupo `docker`: hay que cerrar la terminal (o `wsl --shutdown`) y volver a abrirla. Comandos: `pnpm db:start`, `pnpm db:reset` (migraciones + seed), `pnpm db:types` (regenera y formatea `database.types.ts`), `pnpm db:stop`.
- 2026-10-18 · T14 · `pnpm test:integration` necesita la Supabase local levantada: lee URL y claves de `supabase status` en tiempo de ejecución (nunca se escriben en el repo). Un test de seguridad se valida con un control negativo: apagando RLS (`alter table … disable row level security` en el contenedor local) tiene que fallar.
- 2026-10-18 · T14 · El seed local crea el usuario `demo@taller-freelancer.local` / `demo-local-2026` directamente en `auth.users`: solo existe en el Docker de cada uno y `db reset` lo recrea. Nunca se corre en producción.
- 2026-10-18 · T15a · `.env.local` (local) sale de `pnpm supabase status`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `NEXT_PUBLIC_SITE_URL`. `src/lib/env.ts` las valida con Zod al primer uso y Next solo las inyecta en el cliente si se leen de forma estática (`process.env.NEXT_PUBLIC_X`). Las credenciales de Google van en `supabase/.env` (también ignorado) y se leen con `env(...)` en `config.toml`.
- 2026-10-18 · T15a · Todo destino que venga del usuario (`?next=`) pasa por `safeNextPath`: solo rutas internas (rechaza `https://…`, `//host`, `/\host`, saltos de línea). `/auth/signout` es solo POST, para que un enlace o una imagen en otro sitio no pueda cerrar la sesión.
- 2026-10-18 · T14b · Un trigger que escribe en **otra** tabla corre con el rol de quien dispara el cambio. Al borrar un usuario, Supabase Auth usa `supabase_auth_admin`, sin permisos sobre `public.*`: esos triggers van con `security definer` (y `search_path = ''`). Las migraciones ya aplicadas no se editan: la corrección va en una migración nueva.
- 2026-10-18 · T14b · En los tests, la limpieza (`afterAll`) nunca ignora errores: un `deleteUser` que fallaba en silencio escondió el bug de `touch_project`. Para reproducir algo como el rol de Auth: `docker exec supabase_db_taller-freelancer psql -U supabase_admin -d postgres -c "begin; set local role supabase_auth_admin; …; rollback;"`.
- 2026-10-18 · T15b · Las lecturas de datos van en `src/lib/data/*` con `import 'server-only'` y envueltas en `cache()` de React cuando varias partes del mismo pedido las usan (layout y página). Los tipos que también necesita el cliente van aparte (`src/lib/profile.ts`), sin imports de servidor.
- 2026-10-19 · T16a · supabase-js infiere el tipo de un `select` con relaciones a partir del string (`PROJECT_SELECT` con `as const`): no hace falta `as unknown as …`, y si el mapeo no coincide con la consulta, `tsc` falla. Un `page.tsx` solo puede exportar lo que Next reconoce (`default`, `generateMetadata`…): los helpers compartidos van en otro archivo (`load-project.ts`).
- 2026-10-19 · T16a · Los tests de páginas simulan la capa de datos con `vi.mock('@/lib/data/projects', () => import('../fixtures/data-projects'))`. Para tener datos en tu cuenta local: `pnpm db:seed-me tu@correo.com` (copia los proyectos del usuario demo; se puede repetir). No hagas `db reset` sin necesidad: borra también tu usuario de Google.
- 2026-10-19 · T16b · Las Server Actions se prueban contra la base real en `tests/integration/actions.test.ts`: se simula solo `createSupabaseServerClient` (devuelve un cliente con la sesión del usuario de prueba) y `revalidatePath`. `vitest.integration.config.ts` también apunta `server-only` al stub. Con RLS, un `update`/`delete` sobre una fila ajena no da error: devuelve 0 filas, así que las acciones piden `.select()` y tratan "0 filas" como fallo.
- 2026-10-19 · T16b · PostgREST no tiene transacciones entre varias llamadas: al crear un proyecto con adelanto y primera nota, si falla un hijo se borra el proyecto recién creado (compensación). Si algún día hace falta atomicidad real, va en una función `rpc`.
- 2026-10-19 · T17a · Las variables solo de servidor (`CREDENTIALS_KEY*`) se leen en `src/lib/env-server.ts` (`server-only`), nunca con prefijo `NEXT_PUBLIC_`. Tras el build se verifica que la clave no esté en `.next/static` (buscando su valor sin imprimirlo). Los errores de configuración nombran la variable, nunca su valor.
- 2026-10-19 · T17a · Una Server Action no debe fallar porque falte un campo opcional: en el esquema, `optionalText(...).default(null)` (vacío y ausente dan `null`). El formulario siempre manda todo, pero otra llamada (un test, un script) no tiene por qué.
- 2026-10-19 · T17a · El cuerpo de `Dialog` va al 85% de opacidad (texto del export); para un formulario dentro se usa `body="form"`, así los labels y campos conservan el contraste.
- 2026-10-19 · T17b · Los scripts en TypeScript corren con `tsx --conditions=react-server`: así resuelven los alias `@/…` y `server-only` queda vacío, como en el servidor de Next (sin duplicar `crypto.ts`). esbuild (lo usa tsx) está permitido en `allowBuilds`. `--env-file-if-exists=.env.local` no pisa variables ya definidas: para probar con otras, se pasan en línea delante del comando.
- 2026-10-19 · T17b · Rotar la clave **de verdad** en local cambia el cifrado de tus credenciales: hay que dejar en `.env.local` la clave nueva y su versión. Para practicar, `pnpm rotate-key --dry-run` (no escribe).
- 2026-10-19 · T18 · `service_role` (se salta RLS) solo en `src/lib/supabase/admin.ts` (`server-only`) para `deleteAccount`, y en `scripts/rotate-key.ts`. Una acción con privilegios de admin nunca recibe el id del navegador: lo toma de la sesión. Tras cada build se verifica que ni la `service_role` ni la clave de cifrado estén en `.next/static`.
- 2026-10-20 · T19 · Un campo controlado que escribe en la URL con *debounce* y también la lee (`ProjectFilters`, campo Buscar) guarda lo último que envió (`lastSent`): cuando la URL cambia desde afuera (la búsqueda de la sidebar, "Limpiar filtros"), el campo se actualiza sin volver a escribirla. En los tests del *debounce* se usa `vi.useFakeTimers()` + `act(() => vi.advanceTimersByTime(...))`.
- 2026-10-20 · T20a · Los errores de las Server Actions se muestran con `useActionFeedback().fail(result)` (no con `toast.show(result.error)`): si la sesión venció (`code: 'unauthorized'`, de `SESSION_EXPIRED`), abre el diálogo 401. Un componente que lo usa necesita `ActionFeedbackProvider` (ya incluye el `ToastProvider`); en los tests se envuelve con él.
- 2026-10-20 · T20a · `loading.tsx` se muestra al entrar a una ruta, no cuando solo cambian los `searchParams` (filtros, pestañas, vista): la navegación va en una transición y React deja la vista anterior hasta que llega la nueva. Así el campo Buscar no pierde el foco mientras escribes.
- 2026-10-20 · T20b · Con `useOptimistic`, la actualización del estado real que va **después de un `await`** se envuelve en otro `startTransition`; si no, entra antes de que termine la transición y por un instante se ven el elemento real y el optimista duplicados. Si la acción falla, no hay que deshacer nada: al terminar la transición, `useOptimistic` vuelve solo al estado real.
- 2026-10-20 · T20b · Para probar un estado optimista, la acción simulada devuelve una promesa que el test resuelve a mano (`deferred()` en `payments.test.tsx`) dentro de `act(async () => …)`. React 19 encadena las transiciones asíncronas: si un test falla sin resolver su promesa, los siguientes del mismo archivo fallan en cadena. Hay que mirar el primer fallo.
- 2026-10-20 · T21a · Playwright en WSL necesita librerías del sistema (falta `libnspr4.so` y otras): una sola vez, en tu terminal, `sudo env "PATH=$PATH" ./node_modules/.bin/playwright install-deps chromium`. Con `pnpm exec` bajo `sudo`, Corepack intenta descargar pnpm para root: se llama directo al binario de `node_modules/.bin`.
- 2026-10-20 · T21a · El middleware no redirige las Server Actions (`isServerActionRequest`): sin sesión, una acción tiene que llegar a responder `SESSION_EXPIRED` para que se abra el diálogo 401. Los tests unitarios llaman a la acción directo y no pasan por el middleware: el bug solo se vio en el navegador (Playwright). `pnpm test:a11y` necesita `pnpm db:start` (usuario demo del seed); reusa `pnpm dev` si ya está levantado.
- 2026-10-20 · T21a · Al tabular en dev aparece `<nextjs-portal>` (el indicador de desarrollo de Next): axe y la prueba de foco lo excluyen. Un `<dialog>` modal nativo deja pasar el foco a la interfaz del navegador (`activeElement` = `body`), nunca a la página de atrás: eso es lo esperado.
- 2026-10-20 · T21b · `tsx` agrega un ayudante `__name` a las funciones (`keepNames`). Lighthouse serializa funciones para ejecutarlas dentro de la página, donde ese ayudante no existe: "__name is not defined". El script es `.mts` (ESM), así tsx no transforma Lighthouse. Se mide sobre `pnpm build && pnpm start`, porque Lighthouse no puede excluir el indicador de desarrollo de Next.
- 2026-10-20 · T21b · Una tarjeta clicable entera no va como `<a>` con `aria-labelledby` al título: el nombre accesible no incluye el resto del texto visible (WCAG 2.5.3). El enlace va en el título con `after:absolute after:inset-0` sobre un contenedor `relative`, y el anillo de foco en la tarjeta (`has-[:focus-visible]:outline`).
- 2026-10-22 · T22 · **Ningún `loading.tsx` por encima de una página que navega solo por `searchParams`** (`/proyectos`, `/proyectos/[id]`). En producción (Next 15.5, no en dev) la navegación deja el segmento de página sin datos, Next los pide aparte (`server-patch`) y, según cómo caigan las respuestas, React queda suspendido para siempre: el clic en una pestaña o en "Tabla" no hace nada (~50 %). Un `<Suspense>` dentro de la página reduce el fallo pero no lo elimina (~5 %). Por eso el inicio vive en `(app)/(inicio)/` con su `loading.tsx` (un route group no envuelve a sus hermanos). Lo vigila `tests/unit/loading-boundaries.test.ts`.
- 2026-10-22 · T22 · Un fallo intermitente se mide con muchas corridas (12+ por variante), nunca con una: con un 50 % de fallos, una pasada sola no prueba nada. Y se mide contra el build (`pnpm e2e:build && pnpm e2e:start`), porque `pnpm dev` no reproduce todo.
- 2026-10-22 · T22 · `pnpm test:e2e` compila y levanta su propio build en `.next-e2e` (puerto 3100, `NEXT_DIST_DIR`), así puede correr con `pnpm dev` levantado. Para esperar la hidratación antes de un clic o un `fill`, `hydrated()` (`tests/e2e/hydration.ts`).
- 2026-10-22 · T22 · `next start` deja un proceso llamado `next-server`, no `next start`: se mata con `pkill -f "[n]ext-server"`. Uno viejo que sigue en el puerto sirve el build anterior con los archivos nuevos (CSS en 400, página sin estilos).
- 2026-10-22 · T22 · Con pnpm 12, `publicHoistPattern` viene vacío y los plugins de `next/*` (react-hooks, jsx-a11y…) no quedan en la raíz de `node_modules`: `eslint.config.mjs` los resuelve desde `eslint-config-next` (`resolvePluginsRelativeTo`). Si no, `pnpm lint` falla en una instalación limpia (y en CI).
- 2026-10-22 · T22 · Sin `loading.tsx` por encima, `notFound()` en la ficha responde 404 de verdad (antes 200 por el streaming). En la tabla de rutas, `.next-e2e/types` también queda viejo al mover páginas: se borra junto con `.next/types`.
- 2026-10-22 · T23a · La CSP va con nonce por pedido en el middleware: se fija en la cabecera **del pedido** (`request.headers.set`) antes de `updateSession`, que lo reenvía con `NextResponse.next({ request })`; Next lee el nonce de ahí y se lo pone a sus scripts. Sin `unsafe-inline` ni `unsafe-eval` en producción: cualquier script inline nuevo necesita el nonce (`headers().get('content-security-policy')`).
- 2026-10-22 · T23a · Zod 4 prueba `new Function` (JIT) en el primer `parse` de un objeto: con la CSP eso es una violación en cada formulario, aunque Zod siga funcionando. `schemas.ts` llama a `z.config({ jitless: true })`. Un esquema nuevo que se use en el cliente tiene que importarse desde ahí.
- 2026-10-22 · T23a · Next 15 fija `postcss@8.4.31` (vulnerabilidades altas): `pnpm-workspace.yaml` lo fuerza con `overrides` (`next>postcss`). Si `pnpm audit --prod --audit-level high` falla en CI por una dependencia de Next, se resuelve igual y se documenta el porqué junto al override.
- 2026-10-22 · T23a · En CI, el `.env.local` se arma desde `supabase status -o env` (con `eval`), igual que en local; la `CREDENTIALS_KEY` es aleatoria en cada corrida (`openssl rand -base64 32`, enmascarada), porque el seed no trae credenciales cifradas. Google necesita variables no vacías para que `supabase start` arranque: en CI van valores de relleno.
- 2026-10-22 · T23a · Capturas del README: `pnpm screenshots` (con `pnpm e2e:start` levantado). El `<input type="date">` nativo sale en el formato del sistema (mm/dd en Linux), no en es-PE, aunque se use `locale` o `--lang`: no se capturan formularios con fecha.
- 2026-10-26 · T23b · Las `NEXT_PUBLIC_*` se fijan al compilar: tras cambiarlas en Vercel hay que hacer **Redeploy**, si no el deploy sigue con el valor viejo. Para ver qué `redirect_to` manda producción sin pasar por Google: hacer POST de la Server Action del login y leer el `location` de la respuesta.
- 2026-10-26 · T23b · Si Google vuelve a la raíz (`/?code=…`) en vez de a `/auth/callback`, Supabase rechazó el `redirect_to` (no está en Redirect URLs) y cayó a la Site URL. Si vuelve a `/auth/callback` pero termina en `?error=auth` y en los logs del **API Gateway** hay un `POST /auth/v1/token` con 401, la `NEXT_PUBLIC_SUPABASE_ANON_KEY` de Vercel está mal (los logs de **Auth** no lo muestran: el gateway lo corta antes).
- 2026-10-26 · T23b · En un Preview de Vercel, `NEXT_PUBLIC_SITE_URL` se deja vacía: `site-url.ts` usa el host `*.vercel.app` del pedido, porque cada deploy tiene varias URLs y la cookie del PKCE queda en la que abrió el usuario.
- 2026-10-26 · T24a · En una política de `storage.objects` con un `exists (select … from public.projects p …)`, `name` sin calificar se resuelve como `p.name` (la columna del proyecto), no como el archivo: hay que escribir `objects.name`. El síntoma es "new row violates row-level security" incluso en la carpeta propia.
- 2026-10-26 · T24a · Las miniaturas de Storage se muestran con `next/image` + `unoptimized` (`isStaticThumbnail`): la URL firmada cambia en cada pedido, así que el optimizador no reusaría caché y gastaría el cupo de Vercel. Las Server Actions aceptan 1 MB por defecto: `bodySizeLimit: '3mb'` en `next.config.ts` para las imágenes de 2 MB.
- 2026-10-26 · T24b · Una migración nueva se aplica en Supabase **antes** del push a `main` (si no, producción despliega código que usa algo que todavía no existe): `pnpm supabase link --project-ref <ref>` → `pnpm supabase db push --dry-run` (tiene que listar solo la migración nueva, sin seeds) → `pnpm supabase db push`. Primero Preview (`iqcsxvgcennlvljujhgg`), después Production (`fqhyblsdchagwzbntbhd`).
- 2026-10-26 · T24b · Storage no tiene cascadas: borrar un proyecto o una cuenta no borra sus archivos. `thumbnail-storage.ts` limpia la carpeta (`{owner}/{project}/` o `{owner}/`) después del borrado; si falla, se registra y no rompe la acción.
- 2026-10-27 · T23b · Las variables de Vercel se crean **por entorno**: las de Production no llegan a los Preview. Cada Preview necesita las suyas (proyecto Supabase preview, `CREDENTIALS_KEY` propia, sin `NEXT_PUBLIC_SITE_URL`). Si falta `NEXT_PUBLIC_SUPABASE_URL`, el middleware cae con `MIDDLEWARE_INVOCATION_FAILED` y el log de Vercel nombra la variable. Tras crearlas: Redeploy **del Preview** (no de Production) sin caché de build.
- 2026-10-27 · T23c · `pnpm audit` en la CI puede fallar sin cambios en el código: salen avisos nuevos sobre versiones ya instaladas (así llegó Next 15.5.28). Si la ✗ también está en `main`, no es culpa del PR.
- 2026-10-27 · T24b · La CI arranca Supabase con `-x` (servicios excluidos): si una tanda usa un servicio nuevo (Storage en T24a), hay que sacarlo de esa lista en `ci.yml`. Síntoma: `StorageApiError: name resolution failed` (503 del gateway) solo en CI.
- 2026-10-27 · T23b · Un apagado brusco de la PC (o de WSL) mientras git escribe deja objetos de `.git/objects` y archivos del repo **vacíos o con bytes nulos** ("object file … is empty", "bad object HEAD"). Se repara sin perder nada que esté en GitHub: respaldo de `.git`, borrar los objetos vacíos (`find .git/objects -type f -empty -delete`), `git update-ref` de la rama al último commit sano, `git fetch`, `git fsck`, y `git checkout --` de los archivos dañados. Antes de cerrar la terminal o apagar, esperar a que termine el comando de git.
- 2026-10-28 · T25 · Desde jsdom 30.1.3, `getComputedStyle` no resuelve un `background` abreviado con `var()`, así que `toHaveStyle({ background: 'var(--x)' })` falla aunque el componente esté bien. Se compara el estilo escrito: `toHaveAttribute('style', 'background: var(--x);')`.
- 2026-10-28 · T25 · Al subir la CLI de Supabase (`supabase` en `package.json`), `pnpm db:types` puede generar tipos distintos (2.122 marca como no nulas las columnas de vistas que vienen de una PK). La CI compara `database.types.ts` con lo generado: se regenera y se commitea junto con la subida.

- 2026-10-28 · T25 · El e2e de CSP revisa el nonce en el **HTML que mandó el servidor** (`response.text()`), no en el DOM vivo: React y Next agregan y mueven `<script>` después de cargar (los permite `'strict-dynamic'`), y leerlos del DOM fallaba a veces solo en la CI (mobile), nunca en local ni con CPU 6× más lenta. Lo que el navegador bloquearía lo detecta el listener de `securitypolicyviolation` del mismo test.
- 2026-10-28 · T26 · En el plan gratuito de GitHub, los rulesets (protección de ramas) solo se aplican en repos **públicos**: en uno privado se guardan pero quedan "Not enforced". Las reglas activas de una rama se comprueban sin token: `curl -s https://api.github.com/repos/yrvin-dev/taller-freelancer/rules/branches/main`.
- 2026-10-28 · T26 · Desde T26, `main` no acepta push directo: todo cambio (también los de documentación) va por rama → PR → CI en verde → merge. El cierre de una tanda (casilla del plan y gotchas) va en el mismo PR de la tanda.
- 2026-10-29 · T26 · Un build de Vercel puede fallar con `An error occurred in 'next/font'` / `Cannot read properties of null (reading '1')`: `next/font/google` baja el CSS de Google Fonts al compilar y a veces la respuesta llega distinta. Es momentáneo: **Redeploy** sin caché. Si se repite, la solución de fondo es servir las fuentes desde el repo (`next/font/local`), así el build no depende de un servicio externo.
