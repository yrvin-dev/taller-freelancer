// Formato de montos (PEN) y fechas (es-PE).

const LOCALE = 'es-PE';
const MS_PER_DAY = 86_400_000;

const penFormatter = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'PEN' });
const penWholeFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'PEN',
  maximumFractionDigits: 0,
});
const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
const dateShortFormatter = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short' });
const monthFormatter = new Intl.DateTimeFormat(LOCALE, { month: 'long' });
const weekdayFormatter = new Intl.DateTimeFormat(LOCALE, { weekday: 'short' });

/**
 * `1800` → `S/ 1,800.00`. Con `whole`, sin decimales (`S/ 1,800`), como en los
 * resúmenes del export. Intl separa el símbolo con un espacio duro (U+00A0).
 */
export function formatPEN(amount: number, { whole = false }: { whole?: boolean } = {}): string {
  return (whole ? penWholeFormatter : penFormatter).format(amount);
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

/** Fecha local → `'YYYY-MM-DD'` (la inversa de `parseDate`; no pasa por UTC). */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Suma días de calendario a una fecha local (respeta cambios de mes y año). */
export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Zona horaria de la app (los usuarios están en Perú; Vercel corre en UTC). */
export const APP_TIME_ZONE = 'America/Lima';

/**
 * "Hoy" en Lima como fecha local a medianoche. En el servidor (UTC), `new Date()`
 * ya es el día siguiente entre las 19:00 y las 24:00 de Lima.
 */
export function todayIn(timeZone: string = APP_TIME_ZONE, now: Date = new Date()): Date {
  return parseDate(toISODateIn(now, timeZone)) ?? now;
}

/** Instante → `'YYYY-MM-DD'` del calendario de Lima (ej. `updatedAt` → "3 oct"). */
export function toISODateIn(date: Date, timeZone: string = APP_TIME_ZONE): string {
  // en-CA formatea como YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(date);
}

/** Hora (0–23) en Lima, para el saludo. */
export function hourIn(timeZone: string = APP_TIME_ZONE, now: Date = new Date()): number {
  const hour = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    hourCycle: 'h23',
  }).format(now);
  return Number(hour);
}

/** Saludo del export según la hora: días (< 12), tardes (< 19) o noches. */
export function greeting(hour: number): string {
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

/**
 * `'2026-10-05'` → `octubre 2026` (sin el "de" de Intl, como el export). Con
 * `capitalize`, `Octubre 2026` (encabezados del calendario).
 */
export function formatMonthYear(iso: string, { capitalize = false } = {}): string {
  const date = parseDate(iso);
  if (!date) return '—';
  // Según el ICU, Intl devuelve "octubre" u "Octubre": se normaliza.
  const month = monthFormatter.format(date).toLocaleLowerCase(LOCALE);
  const label = `${month} ${date.getFullYear()}`;
  return capitalize ? label.charAt(0).toUpperCase() + label.slice(1) : label;
}

/** `'2026-10-05'` → `lun` (sin el punto de Intl, como el export). */
export function formatWeekdayShort(iso: string): string {
  const date = parseDate(iso);
  return date ? weekdayFormatter.format(date).replace(/\.$/, '') : '—';
}
