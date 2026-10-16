# 02 · Design System — Taller Freelancer

> Extraído del export de Claude Design (`Taller Freelancer.dc.html` + `_ds/broadsheet…/styles.css`).
> Fuente de verdad visual. Si algo no está aquí, **no existe**: se declara como pendiente y se decide antes de usarlo.
> El export parte de la base **Broadsheet** y la sobrescribe con la paleta propia (pizarra + naranja). Donde chocan, **gana el override del export**.

---

## 1. Cómo se consumen los tokens

- Todos los tokens viven como **CSS custom properties** en `src/styles/tokens.css`: los independientes del tema en `:root`; los de color y sombra bajo `[data-theme="light"]` y `[data-theme="dark"]`; los que referencian a otros tokens (`--status-*`) bajo `[data-theme]`, para que se recalculen en cada contenedor con tema.
- `data-theme`, `data-bg` y `data-accent` van **en el mismo elemento** (normalmente `<html>`).
- Tailwind (v3.4) **no define colores propios**: `tailwind.config.ts` mapea cada clase a `var(--token)`. Ejemplo: `bg-surface` → `var(--color-surface)`.
- El tema se cambia con el atributo `data-theme` en `<html>`. Las variantes de fondo usan `data-bg`; las de acento, `data-accent` (ver §2.4).
- **Cero hex fuera de `tokens.css`.** El lint lo bloquea (ver CLAUDE.md).

---

## 2. Color

### 2.1 Roles base

| Token | Light | Dark | Uso |
|---|---|---|---|
| `--color-bg` | `#efe4d2` (Arena) | `#1d1a17` | Fondo de la app |
| `--color-surface` | `#ffffff` | `#2b2621` | Cards, inputs, sidebar, diálogos |
| `--color-text` | `#2C4059` | `#f4efe7` | Texto principal |
| `--color-divider` | `color-mix(#2C4059 14%)` | `color-mix(#f4efe7 16%)` | Bordes sutiles de inputs y filas de tabla |
| `--color-accent` | `#EF7B3E` (naranja) | `#EF7B3E` | Acción primaria, estado activo, foco |
| `--color-accent-2` | `#EA5455` (coral) | `#EA5455` | Alertas, vencido, destructivo |
| `--color-process-yellow` | `#FFD461` | `#FFD461` | Marca (llama del logo), resaltes puntuales |

### 2.2 Rampas tonales (100–900)

Cada rol tiene su rampa. En dark la rampa **se invierte**: 100 es el más oscuro y 900 el más claro, así "700 = texto sobre tinte" vale en los dos temas.

**Neutral (light):** 100 `#eef1f5` · 200 `#dde3ea` · 300 `#c2ccd8` · 400 `#9aa8b9` · 500 `#77879b` · 600 `#5c6d82` · 700 `#4a5a6f` · 800 `#36475e` · 900 `#2C4059`
**Neutral (dark):** 100 `#22313f` · 200 `#34485f` · 300 `#4a5f77` · 400 `#66798f` · 500 `#8595a8` · 600 `#a6b3c2` · 700 `#c7d0da` · 800 `#e2e7ec` · 900 `#f6f8fa`

**Accent (light):** 100 `#fff0e6` · 200 `#ffd9c2` · 300 `#f9b48c` · 400 `#f4955f` · 500 `#EF7B3E` · 600 `#d4622a` · 700 `#a84a1d` · 800 `#7a3515` · 900 `#4d220e`
**Accent (dark):** 100 `#4a2c1c` · 200 `#6b3a20` · 300 `#94502a` · 400 `#c46634` · 500 `#EF7B3E` · 600 `#f4955f` · 700 `#f9b48c` · 800 `#ffd9c2` · 900 `#fff0e6`

**Accent-2 (light):** 100 `#fdeaea` · 200 `#f9cccc` · 300 `#f3a2a2` · 400 `#ee7778` · 500 `#EA5455` · 600 `#c93d3e` · 700 `#9e2e2f` · 800 `#702122` · 900 `#451415`
**Accent-2 (dark):** 100 `#4a2229` · 200 `#6a2a30` · 300 `#9e3a3c` · 400 `#d44a4b` · 500 `#EA5455` · 600 `#f07f80` · 700 `#f6aaab` · 800 `#fbd3d3` · 900 `#fdeaea`

**Reglas de uso**
- 100–300: fondos tintados de tags y hovers.
- 500: base del rol.
- 700–900: texto sobre tinte y estado pressed.
- El acento puro **no sirve para texto de párrafo** (no llega a 4.5:1). Para links y texto en acento usa `--color-accent-700`.
- El texto sobre `--color-accent` (botón primario) es oscuro y en peso 700: `--color-on-accent` (`#16202e`). ✅ T02

### 2.3 Variantes de fondo (`data-bg`)

| Variante | Light `--color-bg` | Dark `--color-bg` / `--color-surface` |
|---|---|---|
| `arena` (default) | `#efe4d2` | `#1d1a17` / `#2b2621` |
| `pizarra` | `#cdd5df` | `#18222f` / `#2C4059` |
| `salvia` | `#cfdcd6` | `#121c1b` / `#1e2c2a` |

### 2.4 Variantes de acento (`data-accent`)

`naranja` (default `#EF7B3E`) · `terracota` `#D9643A` · `mandarina` `#FF8F2E` · `azul` `#3D9BE9` (complementario) · `turquesa` `#2BB3A8` (complementario dividido).
Cada variante redefine `--color-accent-100…800` en light y en dark (valores en el export). Es una **preferencia de usuario** y se guarda en el perfil.
✅ T02: el export no definía el paso 900 (light) ni 300/400/900 (dark), así que heredaban el naranja. Se completaron en OKLCH tomando la rampa naranja como plantilla (misma L y misma proporción de croma por paso, con el tono de la variante). En dark, 900 = light 100, igual que el patrón del naranja.

### 2.5 Colores semánticos de estado de proyecto

| Estado | Token propuesto | Valor en el export |
|---|---|---|
| En desarrollo | `--status-dev` | accent |
| Revisión | `--status-review` | process-yellow ✅ |
| Producción | `--status-prod` | `success-500` ✅ |
| Mantenimiento | `--status-maint` | `info-500` ✅ (el export usaba accent-2; se cambió porque §9.6 reserva el coral para vencido y destructivo) |
| Archivado | `--status-archived` | neutral-500 ✅ (el export usaba neutral-400, que no llega a 3:1 como elemento no textual) |

✅ T02: `--color-success-*` (base `#22a55b`, el punto verde del export) y `--color-info-*` (base `#4a90c9`, de la paleta del export) se generaron en OKLCH con la rampa naranja como plantilla. El 600 se ajustó a la L media entre 500 y 700, porque las bases son más oscuras que el naranja. En dark: 100–400 propios y 600–900 = light 400–100.

### 2.6 Degradados permitidos (solo estos tres)

1. **Hero del login:** `linear-gradient(150deg, #2C4059 0% 45%, var(--color-accent) 140%)`.
2. **Card destacada ("Entregas próximas"):** `linear-gradient(135deg, var(--color-process-yellow) 0%, var(--color-accent) 70%)`, con texto `--color-on-accent`. **Avatar:** `linear-gradient(135deg, #2C4059, var(--color-accent))`.
3. **Barra de progreso de pagos:** `linear-gradient(90deg, var(--color-process-yellow), var(--color-accent))`.

✅ T02: `--color-ink-deep: #2C4059` en `:root`, independiente del tema.
✅ T02: el fondo por defecto es **arena** y "Entregas próximas" va de amarillo a acento. Confirmado con una captura de referencia del usuario (2026-10-15).

---

## 3. Tipografía

| Rol | Familia | Token | Pesos |
|---|---|---|---|
| Títulos | Source Serif 4 | `--font-heading` | 600 (`--font-heading-weight`) |
| Cuerpo | Source Serif 4 | `--font-body` | 400 (+ itálica real) |
| Marca y navegación | **Nunito** | `--font-ui` ✅ | 600 · 700 · 800 |

**Escala** (densidad 1.25 ya aplicada):

| Elemento | Tamaño | Line-height |
|---|---|---|
| h1 | 42px (login: `clamp(34px, 4.4vw, 54px)`) | 1.12 / 1.05 |
| h2 | 32px | 1.12 |
| h3 | 25px | 1.12 |
| h4 | 20px | 1.12 |
| h5 | 16px | 1.12 |
| h6 / overline | 13px, uppercase, tracking .08em | — |
| body | 15px | 1.55 |
| input / botón | 14px | 1.2 |
| label de campo | 12px | — |
| tag / card-meta | 11px | — |
| th de tabla | 11px, uppercase, tracking .08em | — |

Títulos con `letter-spacing: -0.015em` y `text-wrap: balance`; párrafos con `text-wrap: pretty`.
✅ T02, escala de tamaños: `--text-2xs` 11 · `xs` 12 · `sm` 13 · `md` 14 · `base` 15 · `lg` 16 · `xl` 20 · `2xl` 25 · `3xl` 32 · `4xl` 42. Interlineados: `--leading-tight` 1.12 · `--leading-control` 1.2 · `--leading-body` 1.55. Tracking: `--tracking-heading` -0.015em · `--tracking-caps` .08em.
Las familias se cargan con `next/font` (`--font-source-serif` y `--font-nunito`) y `tokens.css` las compone en `--font-*`.

---

## 4. Espaciado

`--space-1` 5px · `--space-2` 10px · `--space-3` 15px · `--space-4` 20px · `--space-6` 30px · `--space-8` 40px

⚠️ **No existen** `--space-5`, `--space-7` ni `--space-10`. Usarlos rompe en silencio (ya pasó en el export). Si hace falta uno, se agrega al token sheet primero.
Padding de página: `clamp(28px, 5vw, 64px)` en el login. ✅ T02: `--page-pad: clamp(var(--space-4), 4vw, var(--space-8))` para el dashboard (es una propuesta: revisarla en T07). En Tailwind es `p-page`.

## 5. Radios

| Token | Valor (override del export) | Uso |
|---|---|---|
| `--radius-sm` | 6px | Chips internos |
| `--radius-md` | 12px | Inputs, botones cuadrados, ítems de menú |
| `--radius-lg` | 20px | Cards, diálogos, toast |
| pill | 999px | Tags, botón "Continuar con Google", seg-control |

> Broadsheet trae 1/2/4px; el export los sube para un look más amable. **Gana el export.** ✅ `--radius-pill: 999px` (`rounded-pill`).

## 6. Sombras (elevación)

| Token | Light | Dark |
|---|---|---|
| `--shadow-sm` | `0 12px 28px -6px rgba(44,64,89,.28), 0 3px 8px rgba(44,64,89,.10)` | `0 12px 30px -6px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.05)` |
| `--shadow-md` | `0 18px 38px -8px rgba(44,64,89,.34), 0 4px 10px rgba(44,64,89,.12)` | `0 18px 40px -8px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.06)` |
| `--shadow-lg` | `0 26px 56px -10px rgba(44,64,89,.40), 0 6px 14px rgba(44,64,89,.14)` | `0 26px 56px -10px rgba(0,0,0,.65), 0 0 0 1px rgba(255,255,255,.07)` |

Las cards no llevan borde (`border: 0`), solo `--shadow-sm`. Hover → `--shadow-md` + `translateY(-1px)`. Toast y diálogos → `--shadow-lg`.

## 7. Iconos

- **Set:** Flaticon **UIcons** (el export usa 2.6 por CDN; el proyecto usa `@flaticon/flaticon-uicons@3.3.1` self-hosted, porque la 2.6 no está en npm, y trae los 45 glifos del export). Regular rounded (`fi-rr-*`) para la UI, solid rounded (`fi-sr-*`) para estados activos y para la marca (`fi-sr-fire-flame-curved`), brands (`fi-brands-google`, `-github`).
- Tamaños: 13–16px dentro de botones, 19–24px en los íconos de las cards de resumen y 22px en la marca.
- **Switch de tema:** SVG propio (pista de 52×30 con luna y sol, trazo `#111` de 2px). Va como componente `ThemeSwitch`; no se reemplaza por un ícono del set. ✅ T06: sus 7 colores son tokens `--switch-*` en `:root` (iguales en los dos temas). Tamaños: 38×22 (sidebar) y 54×31 en un botón de 62×48 (header).
- ⚠️ Broadsheet recomienda Phosphor duotone; el export usa UIcons. **Gana el export.** Mantener un solo set: un archivo `src/lib/icons.ts` como fuente única de nombres.

## 8. Componentes del export (portar, no inventar)

`Button` (primary / secondary / ghost / icon) · `Tag` (accent / accent-2 / neutral / outline, en pill) · `Field` + `Input` / `Select` / `Textarea` · `Seg` (control segmentado) · `Card` · `Dialog` · `Table` · `Toast` · `Sidebar` (colapsable, unida al header) · `ThemeSwitch` · `SummaryCard` · `ProjectCard` (miniatura 16:10) · `ProjectRow` · `StatusDot` · `Avatar` (iniciales sobre degradado o color) · `EmptyState` · `ErrorScreen` (401/403).

### 8.1 Field: ayuda y error (no están en el export) ✅ T05a

El export solo muestra un tag coral arriba del formulario ("Completa el nombre del proyecto y el cliente."). Para validar por campo se agrega:

- **Ayuda:** debajo del control, 12px, `--color-label` (texto al 70%), con un margen de `--space-1`.
- **Error:** debajo del control (después de la ayuda), 12px, `--color-danger-text`, con el ícono `warning` delante. El borde del control pasa a `--color-danger`.
- Los dos van en `aria-describedby` del control, y el error además pone `aria-invalid`.
- **Seg:** la opción elegida lleva texto `--color-on-accent`, no `--color-bg` como en el export (2.2:1 sobre el acento en arena).

## 9. Reglas anti "look-IA"

1. **Una sola card destacada por pantalla** (la de amarillo a naranja). El resto va en surface plano.
2. **Nada de degradados nuevos**: solo los tres de §2.6.
3. **Nada de bordes de color a la izquierda en las cards**, ni glassmorphism, ni glow.
4. **Sin emojis.** Íconos solo del set de §7.
5. **Sin texto de relleno ni estadísticas decorativas**: cada número es un dato real del usuario.
6. **El acento se usa poco**: CTA principal, ítem activo del menú, foco y estado "En desarrollo". El coral queda para vencido o destructivo.
7. **Jerarquía por tamaño y espacio**, no por cajas dentro de cajas. Una sección no es una card.
8. **Densidad 1.25×**: no apretar el espaciado para que entre más.
9. **Miniaturas reales** (captura del sitio, 1600×1000, 16:10). Nunca un gradiente genérico en su lugar.
10. **Microinteracciones discretas**: hover con sombra y 1px de elevación; sidebar con `transition` de 500ms `cubic-bezier(.32,.72,0,1)` (`--ease-shell`, `--duration-shell`), como el export; las etiquetas entran con retraso y salen rápido. Nada de rebotes. ✅ T07a (antes decía 280ms `cubic-bezier(.2,.8,.2,1)`; ganó el export).

## 10. Estados de interacción

- Hover: tinte de la rampa (100–200) o la sombra siguiente.
- Hover y pressed del primario: `accent-600` y `accent-700` de la rampa del tema, como el export (en dark la rampa está invertida, así que son tonos más claros). ✅ T04
- Hover y pressed sobre superficie (secundario y ghost): `--state-hover`/`--state-pressed` (texto al 7% y 14%) y `--state-accent-*` (acento al 10% y 18%). ✅ T04
- Destructivo: `--color-danger`, `--color-on-danger` y `--color-danger-text` (ver §11). ✅ T04
- Foco: `:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }`. Nunca el anillo azul del navegador.
- Disabled: `opacity: .45`, sin hover.

## 11. Pendientes (resumen 🔶)

Todos resueltos en T02, salvo:

- ✅ T04 · El rojo destructivo `#c0392b` del export con texto oscuro daba 3.02:1 (no AA). Se reemplaza por tokens del coral: en light, fondo `accent-2-600` con texto blanco (4.98:1); en dark, `accent-2-500` con `on-accent` (4.61:1). El texto destructivo (ghost) usa `accent-2-700` en los dos temas (≥ 4.91:1).
- ✅ T04 · El texto del botón ghost y del tag outline usa `accent-700`, no `accent`: el acento puro da 2.77:1 sobre blanco.
- 🔶 La paleta de chips de stack `PAL` (asignada a T03, que no la resolvió) pasa a la tanda de `ProjectCard`.
