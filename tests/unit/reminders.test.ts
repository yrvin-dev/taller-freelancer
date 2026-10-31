import { buildReminderEmail, describeReminder } from '@/lib/reminder-email';
import {
  dueReminders,
  OVERDUE_WINDOW_DAYS,
  reminderKey,
  type DueReminder,
  type ReminderProject,
} from '@/lib/reminders';
import { reminderPrefsSchema } from '@/lib/schemas';

const TODAY = new Date(2026, 9, 31); // 31 oct 2026, en hora local

const project = (over: Partial<ReminderProject> = {}): ReminderProject => ({
  id: 'p1',
  name: 'Colegio Monteazul',
  status: 'en_desarrollo',
  deliveryDate: null,
  domainExpires: null,
  hostingExpires: null,
  ...over,
});

describe('dueReminders', () => {
  it('avisa entregas, dominio y hosting dentro de la anticipación, lo más urgente primero', () => {
    const result = dueReminders(
      [
        project({ id: 'a', name: 'A', deliveryDate: '2026-11-05', domainExpires: '2026-11-01' }),
        project({ id: 'b', name: 'B', hostingExpires: '2026-10-31' }),
      ],
      TODAY,
      7,
    );
    expect(result.map((r) => [r.projectName, r.kind, r.days])).toEqual([
      ['B', 'hosting', 0],
      ['A', 'dominio', 1],
      ['A', 'entrega', 5],
    ]);
  });

  it('respeta la anticipación elegida', () => {
    const projects = [project({ deliveryDate: '2026-11-08' })]; // en 8 días
    expect(dueReminders(projects, TODAY, 7)).toEqual([]);
    expect(dueReminders(projects, TODAY, 14)).toHaveLength(1);
  });

  it('dominio y hosting vencidos se avisan hasta 30 días después; las entregas pasadas, no', () => {
    const result = dueReminders(
      [
        project({ id: 'a', domainExpires: '2026-10-21', deliveryDate: '2026-10-30' }),
        project({ id: 'b', hostingExpires: '2026-09-30' }), // hace 31 días
      ],
      TODAY,
      3,
    );
    expect(result.map((r) => [r.projectId, r.kind, r.days])).toEqual([['a', 'dominio', -10]]);
    expect(OVERDUE_WINDOW_DAYS).toBe(30);
  });

  it('no avisa proyectos archivados, ni entregas de proyectos en Producción', () => {
    const result = dueReminders(
      [
        project({
          id: 'arch',
          status: 'archivado',
          deliveryDate: '2026-11-01',
          domainExpires: '2026-11-01',
        }),
        project({
          id: 'prod',
          status: 'produccion',
          deliveryDate: '2026-11-01',
          hostingExpires: '2026-11-02',
        }),
      ],
      TODAY,
      7,
    );
    expect(result.map((r) => [r.projectId, r.kind])).toEqual([['prod', 'hosting']]);
  });

  it('no repite lo que ya se avisó (mismo proyecto, tipo y fecha)', () => {
    const projects = [project({ deliveryDate: '2026-11-02', domainExpires: '2026-11-03' })];
    const sent = new Set([reminderKey({ projectId: 'p1', kind: 'entrega', dueOn: '2026-11-02' })]);
    expect(dueReminders(projects, TODAY, 7, sent).map((r) => r.kind)).toEqual(['dominio']);
  });

  it('si cambia la fecha, es un aviso nuevo', () => {
    const sent = new Set([reminderKey({ projectId: 'p1', kind: 'entrega', dueOn: '2026-11-02' })]);
    expect(dueReminders([project({ deliveryDate: '2026-11-04' })], TODAY, 7, sent)).toHaveLength(1);
  });
});

describe('correo de recordatorios', () => {
  const reminder = (over: Partial<DueReminder> = {}): DueReminder => ({
    projectId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
    projectName: 'Colegio Monteazul',
    kind: 'dominio',
    dueOn: '2026-11-03',
    days: 3,
    ...over,
  });
  const SITE = 'https://taller-freelancer.vercel.app';

  it('describe cada aviso en castellano', () => {
    expect(describeReminder(reminder())).toBe('vence el 3 nov 2026 (en 3 días)');
    expect(describeReminder(reminder({ dueOn: '2026-10-28', days: -3 }))).toBe(
      'venció el 28 oct 2026 (hace 3 días)',
    );
    expect(describeReminder(reminder({ kind: 'entrega', dueOn: '2026-10-31', days: 0 }))).toBe(
      'se entrega hoy',
    );
  });

  it('un aviso: el asunto lo nombra; varios: los cuenta', () => {
    expect(
      buildReminderEmail({ name: 'Yrvin', reminders: [reminder()], siteUrl: SITE }).subject,
    ).toBe('Dominio de Colegio Monteazul: vence el 3 nov 2026 (en 3 días)');
    const two = buildReminderEmail({
      name: 'Yrvin',
      reminders: [reminder(), reminder({ kind: 'hosting' })],
      siteUrl: SITE,
    });
    expect(two.subject).toBe('2 recordatorios de tus proyectos');
  });

  it('enlaza a cada ficha y a Cuenta para desactivarlos', () => {
    const { html, text } = buildReminderEmail({
      name: 'Yrvin',
      reminders: [reminder()],
      siteUrl: SITE,
    });
    expect(html).toContain(`href="${SITE}/proyectos/7c9e6679-7425-40de-944b-e07fc1f90ae7"`);
    expect(html).toContain(`href="${SITE}/cuenta"`);
    expect(text).toContain(`${SITE}/proyectos/7c9e6679-7425-40de-944b-e07fc1f90ae7`);
    expect(text).toContain('desactívalos en');
  });

  it('escapa lo que escribe el usuario y no deja saltos de línea en el asunto', () => {
    const evil = reminder({ projectName: '<img src=x onerror=alert(1)>\r\nBcc: otro@malo.com' });
    const { html, subject } = buildReminderEmail({
      name: '<b>Yo</b>',
      reminders: [evil],
      siteUrl: SITE,
    });
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).toContain('Hola, &lt;b&gt;Yo&lt;/b&gt;:');
    expect(subject).not.toMatch(/[\r\n]/);
  });
});

describe('reminderPrefsSchema', () => {
  it('acepta 3, 7 o 14 días y nada más', () => {
    for (const days of [3, 7, 14]) {
      expect(reminderPrefsSchema.safeParse({ enabled: true, days }).success).toBe(true);
    }
    for (const days of [0, 5, 30, '7']) {
      expect(reminderPrefsSchema.safeParse({ enabled: true, days }).success).toBe(false);
    }
    expect(reminderPrefsSchema.safeParse({ enabled: 'si', days: 7 }).success).toBe(false);
  });
});
