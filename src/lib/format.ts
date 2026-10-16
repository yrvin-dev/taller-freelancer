// Formato de montos (PEN) y fechas (es-PE).

const LOCALE = 'es-PE';
const MS_PER_DAY = 86_400_000;

const penFormatter = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'PEN' });
const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
const dateShortFormatter = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short' });

/** `1800` → `S/ 1,800.00`. Intl separa el símbolo con un espacio duro (U+00A0). */
export function formatPEN(amount: number): string {
  return penFormatter.format(amount);
}

/**
 * `'2026-10-05'` → fecha local a medianoche. `new Date('2026-10-05')` la tomaría
 * como UTC y en Lima (UTC−5) se mostraría el día anterior.
 */
export function parseDate(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const [, y, m, d] = match.map(Number) as [number, number, number, number];
  const date = new Date(y, m - 1, d);
  // Rechaza fechas que Date "corrige", como 2026-02-30.
  return date.getMonth() === m - 1 && date.getDate() === d ? date : null;
}

// Intl abrevia el mes con punto ("oct."); el export lo muestra sin él ("5 oct 2026").
function formatWithoutDot(formatter: Intl.DateTimeFormat, date: Date): string {
  return formatter
    .formatToParts(date)
    .map((p) => (p.type === 'month' ? p.value.replace(/\.$/, '') : p.value))
    .join('');
}

/** `'2026-10-05'` → `5 oct 2026`; vacío o inválido → `—`. */
export function formatDate(iso: string | null | undefined): string {
  const date = iso ? parseDate(iso) : null;
  return date ? formatWithoutDot(dateFormatter, date) : '—';
}

/** `'2026-10-05'` → `5 oct`; vacío o inválido → `—`. */
export function formatDateShort(iso: string | null | undefined): string {
  const date = iso ? parseDate(iso) : null;
  return date ? formatWithoutDot(dateShortFormatter, date) : '—';
}

/** Días de `today` a `iso` (negativo si ya pasó). `today` se recibe para poder testear. */
export function daysUntil(iso: string, today: Date): number | null {
  const date = parseDate(iso);
  if (!date) return null;
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((date.getTime() - start.getTime()) / MS_PER_DAY);
}

/** `0` → `hoy`, `1` → `mañana`, `5` → `en 5 días`, `-2` → `hace 2 días`. */
export function formatRelativeDays(days: number): string {
  if (days === 0) return 'hoy';
  if (days === 1) return 'mañana';
  if (days === -1) return 'ayer';
  return days < 0 ? `hace ${-days} días` : `en ${days} días`;
}
