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
