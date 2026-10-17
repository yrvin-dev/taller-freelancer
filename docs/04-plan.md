# 04 · Plan de tandas — Taller Freelancer

> Una tanda = un commit atómico. No se encadenan. Método completo en `CLAUDE.md`.
> Cada tanda verifica con `pnpm lint && pnpm typecheck && pnpm test` y una revisión visual contra el export (light y dark, a 375px y 1440px).

## Fase 0 · Fundaciones

### [x] T01 · Scaffold
- **Objetivo:** proyecto Next.js 15 con TypeScript strict, Tailwind 3.4, ESLint, Prettier y Vitest.
- **Archivos:** `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `eslint.config.mjs`, `.prettierrc`, `.gitignore`, `.env.example`, `vitest.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`.
- **Hecho cuando:** `pnpm dev` levanta, `pnpm build` pasa y `.env*` está ignorado (excepto `.env.example`).

### [x] T02 · Tokens
- **Objetivo:** pasar a CSS los tokens de `02-design-system.md` (light, dark, `data-bg` y `data-accent`), resolver los 🔶 que bloquean y mapear Tailwind a `var(--*)`. Cargar Source Serif 4 y Nunito con `next/font`.
- **Archivos:** `src/styles/tokens.css`, `src/styles/globals.css`, `tailwind.config.ts`, `src/app/layout.tsx`, `docs/02-design-system.md` (marcar los 🔶 resueltos).
- **Hecho cuando:** una página de prueba `/_tokens` (solo en dev) muestra rampas, tipos, radios y sombras igual que el export en los dos temas. La regla ESLint `no-hex` falla con un hex de prueba.

### [x] T03 · Íconos y dominio
- **Objetivo:** fuente única de íconos (UIcons) y de enums, labels y colores de estado.
- **Archivos:** `src/lib/icons.ts`, `src/lib/domain.ts`, `src/lib/format.ts`, `tests/unit/format.test.ts`.
- **Hecho cuando:** `formatPEN(1800)` devuelve `S/ 1,800.00`, las fechas salen en es-PE y los tests pasan.

## Fase 1 · Componentes base (portados del export)

### [x] T04 · UI primitives I
- **Objetivo:** `Button`, `Tag`, `StatusDot`, `Avatar` y `Card`.
- **Archivos:** `src/components/ui/{Button,Tag,StatusDot,Avatar,Card}.tsx` y sus tests.
- **Hecho cuando:** hover, pressed, focus y disabled coinciden con el export, y no queda ningún hex.

### [x] T05a · UI primitives II · formularios
- **Objetivo:** `Field`, `Input`, `Select`, `Textarea` y `Seg`.
- **Archivos:** `src/components/ui/{Field,Input,Select,Textarea,Seg}.tsx` y sus tests.
- **Hecho cuando:** cada label está asociado a su input, y la ayuda y el error quedan en `aria-describedby`.

### [x] T05b · UI primitives II · overlays
- **Objetivo:** `Dialog` (nativo, `showModal`) y `Toast` (`ToastProvider` + `useToast`).
- **Archivos:** `src/components/ui/{Dialog,Toast}.tsx` y sus tests.
- **Hecho cuando:** el `Dialog` atrapa el foco y cierra con Esc, y el `Toast` se anuncia en una región `role="status"`.

### [x] T05c · Contraste de label y placeholder
- **Objetivo:** corregir T05a: el texto al 70% y al 65% del export no llega a 4.5:1 en light. Pasan a `neutral-700` y `neutral-600`.
- **Archivos:** `src/styles/tokens.css`, `tests/unit/contrast.test.ts`.
- **Hecho cuando:** un test mide label y placeholder contra `tokens.css` en los dos temas y los tres fondos.

### [x] T06 · ThemeSwitch
- **Objetivo:** el switch con luna y sol en SVG (tamaños `sm` y `md`), con persistencia en una cookie para que no haya parpadeo al cargar.
- **Archivos:** `src/components/ui/ThemeSwitch.tsx`, `src/app/layout.tsx`.
- **Hecho cuando:** al recargar en dark no hay flash del tema claro.

## Fase 2 · Layout

### [x] T07a · Shell de la app · desktop
- **Objetivo:** layout `(app)` y `Sidebar` colapsable del export (76 ↔ 240px, 500ms `cubic-bezier(.32,.72,0,1)`), con el estado en la cookie `tf-side`. La home pasa a `(app)/page.tsx`.
- **Archivos:** `src/components/layout/Sidebar.tsx`, `src/app/(app)/{layout,page}.tsx`, `src/lib/{nav,layout-prefs}.ts`, `src/lib/mock/user.ts`.
- **Hecho cuando:** colapsar y expandir es fluido, el estado persiste al recargar sin salto y el ítem activo lleva `aria-current`.

### [x] T07b · Shell de la app · mobile y encabezado
- **Objetivo:** debajo de 820px, `AppHeader` (marca) y `BottomNav` fija de 4 ítems, como en el export (no drawer). `PageHeader` (título, bajada, acciones y switch de tema). El toast sube sobre la barra inferior.
- **Archivos:** `src/components/layout/{AppHeader,BottomNav,PageHeader}.tsx`, `src/app/(app)/layout.tsx`, `src/components/ui/Toast.tsx`.
- **Hecho cuando:** todo es usable a 375px, con objetivos de 44px y la barra respetando `safe-area-inset-bottom`.

## Fase 3 · Páginas (con datos mock tipados)

### [x] T08 · Login
- **Objetivo:** la pantalla del export (hero en degradado y botón de Google), todavía sin auth real.
- **Archivos:** `src/app/(auth)/login/page.tsx`.
- **Hecho cuando:** coincide visualmente con el export en desktop y en mobile.

### [x] T09a · Home · datos y lógica
- **Objetivo:** tipo `Project`, los 6 proyectos del export como mock (fechas relativas a hoy) y la lógica de resumen: entregas próximas, por vencer (30 días + dominios por comprar) y pagos pendientes. Miniaturas en WebP.
- **Archivos:** `src/lib/{projects,summary}.ts`, `src/lib/mock/projects.ts`, `src/lib/format.ts`, `public/mock/thumbs/*.webp`, `tests/unit/summary.test.ts`.
- **Hecho cuando:** los badges ("en 3 días", "Comprar") y los totales se calculan desde los datos, con tests en fechas fijas.

### [x] T09b · Home · UI
- **Objetivo:** saludo, las 3 `SummaryCard` (solo "Entregas próximas" destacada; las otras en surface plano, 02 §9), proyectos recientes y estado vacío.
- **Archivos:** `src/components/projects/{HomeDashboard,SummaryCard,RecentProjects,HomeEmptyState}.tsx`, `src/app/(app)/page.tsx`.
- **Hecho cuando:** coincide con el export en light y dark, a 375px y 1440px.

### [x] T10 · Lista de proyectos
- **Objetivo:** `ProjectCard` (miniatura 16:10), `ProjectRow` y el switch entre tarjetas y tabla.
- **Archivos:** `src/components/projects/{ProjectCard,ProjectRow}.tsx`, `src/app/(app)/proyectos/page.tsx`.
- **Hecho cuando:** las dos vistas muestran los mismos datos y el estado de producción lleva el punto verde.

### [x] T11a · Detalle de proyecto · cabecera y pestañas
- **Objetivo:** cabecera de la ficha (volver, editar, miniatura, código, tipo, estado y cliente), pestañas en la URL (`?tab=`) y las pestañas Resumen, Cliente y Stack. Mock ampliado con los datos del cliente, la ruta local y los enlaces.
- **Archivos:** `src/app/(app)/proyectos/[id]/page.tsx`, `src/components/projects/detail/*`, `src/components/ui/CopyButton.tsx`, `src/lib/{projects,links}.ts`, `src/lib/mock/projects.ts`.
- **Hecho cuando:** coincide con el export, un id inexistente da 404 y las pestañas sobreviven a la recarga.

### [ ] T11b · Detalle de proyecto · accesos, pagos y notas
- **Objetivo:** pestañas Accesos (`LinkList`, `CredentialRow` con el secreto oculto y "Mostrar" vía `revealCredential`, y Vencimientos), Pagos (`PaymentList`) y Notas (`NoteLog` con borrado y confirmación en la línea), y el diálogo "Eliminar / Archivar".
- **Archivos:** `src/components/projects/detail/*`, `src/app/(app)/proyectos/[id]/actions.ts`, `docs/02-design-system.md` (Credenciales y lista de pagos, que no están en el export).
- **Hecho cuando:** coincide con el export, se ve bien sin pagos ni notas (estados vacíos) y el secreto no está en el HTML inicial.

> Fase 2: la pestaña "Editores CMS" del export (tabla de editores y guía de edición) no entra en el MVP: no está en el 01 ni en el 03.

### [ ] T12 · Formulario nuevo / editar
- **Objetivo:** `ProjectForm` con React Hook Form y Zod, y la subida de la miniatura.
- **Archivos:** `src/lib/schemas.ts`, `src/components/projects/ProjectForm.tsx`, `proyectos/nuevo/page.tsx`, `proyectos/[id]/editar/page.tsx`, tests del esquema.
- **Hecho cuando:** los errores se muestran por campo y el esquema es el mismo en el cliente y en el servidor.

### [ ] T13 · Calendario, Cuenta, 403 y 401
- **Objetivo:** las pantallas restantes del export.
- **Archivos:** `calendario/page.tsx`, `cuenta/page.tsx`, `403/page.tsx`, `SessionExpiredDialog.tsx`, `not-found.tsx`, `error.tsx`.
- **Hecho cuando:** todas las pantallas del export tienen su ruta.

## Fase 4 · Datos y auth

### [ ] T14 · Supabase: esquema y RLS
- **Objetivo:** migraciones (tablas, enums, índices, triggers y la vista `project_summary`), RLS en todas las tablas y el seed con proyectos "(F)".
- **Archivos:** `supabase/migrations/0001_init.sql`, `0002_rls.sql`, `supabase/seed.sql`, `src/lib/database.types.ts`.
- **Hecho cuando:** un test de integración con dos usuarios confirma que A no puede leer ni escribir los datos de B.

### [ ] T15 · Auth con Google
- **Objetivo:** login con Google, callback, middleware, cierre de sesión y el trigger que crea el perfil.
- **Archivos:** `src/lib/supabase/*`, `src/middleware.ts`, `src/app/auth/callback/route.ts`, `login/page.tsx`.
- **Hecho cuando:** las rutas privadas redirigen a `/login` sin sesión y el perfil se crea la primera vez.

### [ ] T16 · Capa de datos y Server Actions
- **Objetivo:** reemplazar el mock por `src/lib/data/*` en las lecturas y por Server Actions en el CRUD de proyectos, pagos y notas.
- **Archivos:** `src/lib/data/*.ts`, `src/app/(app)/proyectos/actions.ts`; se borra `src/lib/mock.ts`.
- **Hecho cuando:** el CRUD funciona de punta a punta, `revalidatePath` refresca la vista y desaparece cualquier import del mock.

### [ ] T17 · Credenciales cifradas
- **Objetivo:** `crypto.ts`, la acción `revealCredential` y el script de rotación de clave.
- **Archivos:** `src/lib/crypto.ts`, `src/lib/data/credentials.ts`, `scripts/rotate-key.ts`, `tests/unit/crypto.test.ts`.
- **Hecho cuando:** en la base solo hay ciphertext, al manipular el tag el descifrado falla y el secreto nunca aparece en el HTML inicial.

### [ ] T18 · Cuenta: exportar y borrar
- **Objetivo:** guardar las preferencias, exportar el JSON (sin secretos) y borrar la cuenta en cascada.
- **Archivos:** `src/app/(app)/cuenta/actions.ts`, `src/lib/data/profile.ts`.
- **Hecho cuando:** tras borrar la cuenta no queda ninguna fila del usuario.

## Fase 5 · Interactividad

### [ ] T19 · Búsqueda y filtros en la URL
- **Objetivo:** búsqueda con debounce y desplegables de estado (con contador), stack y CMS. "Limpiar filtros" y la vista elegida se guardan en `searchParams`.
- **Archivos:** `ProjectFilters.tsx`, `proyectos/page.tsx`, `src/lib/data/projects.ts`.
- **Hecho cuando:** recargar o compartir la URL conserva los filtros y hay un estado vacío para "sin resultados".

### [ ] T20 · Estados y feedback
- **Objetivo:** skeletons (`loading.tsx`), toasts, actualizaciones optimistas en notas y pagos, y el diálogo 401.
- **Archivos:** los `loading.tsx` de cada ruta, `Toast`, `NoteLog`, `PaymentList`.
- **Hecho cuando:** no hay saltos de layout y toda acción tiene feedback.

## Fase 6 · Calidad

### [ ] T21 · Accesibilidad AA
- **Objetivo:** auditoría con axe y Lighthouse: contraste, foco, landmarks, `aria-*` del sidebar y los diálogos, y objetivos táctiles de 44px.
- **Archivos:** los que la auditoría señale.
- **Hecho cuando:** Lighthouse da 100 en accesibilidad en todas las rutas, en light y en dark.

### [ ] T22 · e2e
- **Objetivo:** los flujos de Playwright definidos en `03 §9`.
- **Archivos:** `tests/e2e/*`, `playwright.config.ts`.
- **Hecho cuando:** los e2e pasan en Chromium, tanto en desktop como en mobile.

## Fase 7 · Deploy

### [ ] T23 · CI/CD y producción
- **Objetivo:**
  - GitHub Actions con lint, typecheck, tests unitarios, e2e y build.
  - Vercel con previews por PR, conectado a dos proyectos de Supabase (Preview y Production).
  - Cabeceras de seguridad configuradas.
- **Archivos:** `.github/workflows/ci.yml`, `next.config.ts`, `README.md` (con capturas, el stack y las decisiones, pensado para el portafolio).
- **Hecho cuando:** un merge a `main` despliega solo y la URL de producción tiene el login de Google funcionando.

---

## Fase 2+ (fuera del MVP)

Kanban por estado · adjuntos · recordatorios por correo de entregas y dominios · checklist de tandas por proyecto · integración con la API de Vercel para traer el estado del deploy · Sentry.
