import {
  addDays,
  daysUntil,
  formatDate,
  formatDateShort,
  formatPEN,
  formatRelativeDays,
  parseDate,
  toISODate,
} from '@/lib/format';

const NBSP = '\u00a0';

describe('formatPEN', () => {
  it('formatea soles con separador de miles y dos decimales', () => {
    expect(formatPEN(1800)).toBe(`S/${NBSP}1,800.00`);
  });

  it('formatea cero y decimales', () => {
    expect(formatPEN(0)).toBe(`S/${NBSP}0.00`);
    expect(formatPEN(1234567.5)).toBe(`S/${NBSP}1,234,567.50`);
  });
});

describe('parseDate', () => {
  it('interpreta YYYY-MM-DD en hora local, no en UTC', () => {
    const date = parseDate('2026-10-05');
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(9);
    expect(date?.getDate()).toBe(5);
  });

  it('rechaza formatos y fechas inválidas', () => {
    expect(parseDate('05/10/2026')).toBeNull();
    expect(parseDate('2026-02-30')).toBeNull();
    expect(parseDate('')).toBeNull();
  });
});

describe('formatDate', () => {
  it('muestra día, mes abreviado sin punto y año en es-PE', () => {
    expect(formatDate('2026-10-05')).toBe('5 oct 2026');
    expect(formatDate('2026-09-15')).toBe('15 set 2026');
  });

  it('devuelve un guion largo si no hay fecha', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
    expect(formatDate('no-es-fecha')).toBe('—');
  });

  it('formatDateShort omite el año', () => {
    expect(formatDateShort('2026-01-31')).toBe('31 ene');
    expect(formatDateShort(null)).toBe('—');
  });
});

describe('daysUntil', () => {
  const today = new Date(2026, 9, 5, 18, 30); // la hora del día no debe influir

  it('cuenta días hacia adelante y hacia atrás', () => {
    expect(daysUntil('2026-10-05', today)).toBe(0);
    expect(daysUntil('2026-10-06', today)).toBe(1);
    expect(daysUntil('2026-11-04', today)).toBe(30);
    expect(daysUntil('2026-10-01', today)).toBe(-4);
  });

  it('devuelve null con una fecha inválida', () => {
    expect(daysUntil('mañana', today)).toBeNull();
  });
});

describe('formatRelativeDays', () => {
  it.each([
    [0, 'hoy'],
    [1, 'mañana'],
    [-1, 'ayer'],
    [5, 'en 5 días'],
    [-3, 'hace 3 días'],
  ])('%i → %s', (days, expected) => {
    expect(formatRelativeDays(days)).toBe(expected);
  });
});

describe('toISODate y addDays', () => {
  it('formatea en hora local, ida y vuelta con parseDate', () => {
    const date = new Date(2026, 0, 5, 23, 59);
    expect(toISODate(date)).toBe('2026-01-05');
    expect(toISODate(parseDate('2026-12-31')!)).toBe('2026-12-31');
  });

  it('cruza meses y años', () => {
    expect(toISODate(addDays(new Date(2026, 9, 30), 3))).toBe('2026-11-02');
    expect(toISODate(addDays(new Date(2026, 11, 31), 1))).toBe('2027-01-01');
    expect(toISODate(addDays(new Date(2026, 9, 5), -5))).toBe('2026-09-30');
  });
});
