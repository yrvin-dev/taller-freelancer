// Lógica del panel de inicio (las 3 SummaryCard), portada del export. Funciones puras:
// reciben `today` para que los badges ("en 3 días", "Comprar") se calculen y se testeen.

import {
  daysUntil,
  formatDate,
  formatMonthYear,
  formatRelativeDays,
  formatWeekdayShort,
} from './format';
import { paidPen, type Project } from './projects';

/** Ventana de "Por vencer" (export: "Próximos 30 días"). */
export const EXPIRY_WINDOW_DAYS = 30;
/** Un vencimiento a 7 días o menos se marca como urgente (tag coral). */
export const URGENT_DAYS = 7;

export type UpcomingDelivery = { project: Project; days: number };

/** Entregas futuras (o de hoy) de proyectos que no están en Producción ni Archivados. */
export function upcomingDeliveries(projects: Project[], today: Date): UpcomingDelivery[] {
  return projects
    .filter((p) => p.status !== 'archivado' && p.status !== 'produccion')
    .flatMap((project) => {
      const days = project.deliveryDate ? daysUntil(project.deliveryDate, today) : null;
      return days !== null && days >= 0 ? [{ project, days }] : [];
    })
    .sort((a, b) => a.days - b.days);
}

export type Expiry =
  | { project: Project; kind: 'dominio' | 'hosting'; pending: false; days: number }
  | { project: Project; kind: 'dominio'; pending: true };

/**
 * Dominios y hosting que vencen en los próximos 30 días, más los dominios por comprar.
 * Los pendientes de compra van primero (como en el export) y el resto por fecha.
 */
export function expiringSoon(projects: Project[], today: Date): Expiry[] {
  const active = projects.filter((p) => p.status !== 'archivado');

  const pending: Expiry[] = active
    .filter((p) => p.domainPending)
    .map((project) => ({ project, kind: 'dominio', pending: true }));

  const dated = active
    .flatMap((project) =>
      (
        [
          ['dominio', project.domainExpires],
          ['hosting', project.hostingExpires],
        ] as const
      ).flatMap(([kind, date]) => {
        const days = date ? daysUntil(date, today) : null;
        return days !== null && days >= 0 && days <= EXPIRY_WINDOW_DAYS
          ? [{ project, kind, pending: false as const, days }]
          : [];
      }),
    )
    .sort((a, b) => a.days - b.days);

  return [...pending, ...dated];
}

/** Tono del badge de un vencimiento: coral si es urgente o hay que comprar. */
export function expiryTone(expiry: Expiry): 'accent-2' | 'neutral' {
  return expiry.pending || expiry.days <= URGENT_DAYS ? 'accent-2' : 'neutral';
}

export type PendingPayment = { project: Project; budget: number; paid: number; balance: number };

/** Proyectos no archivados con saldo por cobrar (presupuesto − pagos > 0). */
export function pendingPayments(projects: Project[]): PendingPayment[] {
  return projects
    .filter((p) => p.status !== 'archivado' && p.budgetPen !== null)
    .flatMap((project) => {
      const budget = project.budgetPen ?? 0;
      const paid = paidPen(project);
      const balance = Math.round((budget - paid) * 100) / 100;
      return balance > 0 ? [{ project, budget, paid, balance }] : [];
    });
}

export function totalBalance(pending: PendingPayment[]): number {
  return Math.round(pending.reduce((total, p) => total + p.balance * 100, 0)) / 100;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Bajada del saludo: "3 proyectos en desarrollo · 2 dominios por comprar · 3 saldos por cobrar." */
export function homeSummaryLine(projects: Project[]): string {
  const inDev = projects.filter((p) => p.status === 'en_desarrollo').length;
  const toBuy = projects.filter((p) => p.status !== 'archivado' && p.domainPending).length;
  const owing = pendingPayments(projects).length;
  return [
    plural(inDev, 'proyecto en desarrollo', 'proyectos en desarrollo'),
    plural(toBuy, 'dominio por comprar', 'dominios por comprar'),
    plural(owing, 'saldo por cobrar', 'saldos por cobrar'),
  ]
    .join(' · ')
    .concat('.');
}

/** Los N proyectos actualizados más recientemente. */
export function recentProjects(projects: Project[], limit = 4): Project[] {
  return [...projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, limit);
}

export type ExpiryCard = {
  label: 'Dominio' | 'Hosting';
  date: string;
  status: string;
  tone: 'accent-2' | 'neutral';
};

/** Las dos tarjetas de "Vencimientos" de la ficha (export: `expiries`). */
export function expiryCards(
  project: Pick<Project, 'domainPending' | 'domainExpires' | 'hostingExpires'>,
  today: Date,
): [ExpiryCard, ExpiryCard] {
  const card = (label: ExpiryCard['label'], date: string | null): ExpiryCard => {
    const days = date ? daysUntil(date, today) : null;
    return {
      label,
      date: date ? formatDate(date) : 'Sin fecha',
      status:
        days === null ? 'No aplica' : days < 0 ? 'Vencido' : `Vence ${formatRelativeDays(days)}`,
      tone: days !== null && days <= EXPIRY_WINDOW_DAYS ? 'accent-2' : 'neutral',
    };
  };

  const domain: ExpiryCard = project.domainPending
    ? { label: 'Dominio', date: 'Pendiente de compra', status: 'Por comprar', tone: 'accent-2' }
    : card('Dominio', project.domainExpires);

  return [domain, card('Hosting', project.hostingExpires)];
}

export type AgendaKind = 'entrega' | 'dominio' | 'hosting';

export type AgendaEvent = {
  id: string;
  projectId: string;
  date: string;
  kind: AgendaKind;
  title: string;
  detail: string;
  tone: 'accent' | 'accent-2' | 'neutral';
  /** `05` y `lun`, como el día grande del export. */
  day: string;
  weekday: string;
};

export type AgendaMonth = { key: string; label: string; events: AgendaEvent[] };

const KIND_ORDER: Record<AgendaKind, number> = { entrega: 0, dominio: 1, hosting: 2 };

/**
 * Agenda del calendario (export: `agenda`): entregas y vencimientos de dominio y
 * hosting desde hoy, sin archivados, ordenados y agrupados por mes. Los vencimientos
 * usan la regla de la home: coral a 7 días o menos (02 §8.5).
 */
export function agendaEvents(projects: Project[], today: Date): AgendaMonth[] {
  const events: AgendaEvent[] = [];

  for (const project of projects) {
    if (project.status === 'archivado') continue;
    const candidates: [AgendaKind, string | null, string][] = [
      ['entrega', project.deliveryDate, `Entrega · ${project.client}`],
      ['dominio', project.domainExpires, ['Dominio', project.domainName].filter(Boolean).join(' ')],
      [
        'hosting',
        project.hostingExpires,
        ['Hosting', project.stack.hosting.join(' + ')].filter(Boolean).join(' '),
      ],
    ];
    for (const [kind, date, detail] of candidates) {
      const days = date ? daysUntil(date, today) : null;
      if (date === null || days === null || days < 0) continue;
      events.push({
        id: `${project.id}-${kind}`,
        projectId: project.id,
        date,
        kind,
        title: project.name,
        detail,
        tone: kind === 'entrega' ? 'accent' : days <= URGENT_DAYS ? 'accent-2' : 'neutral',
        day: date.slice(8, 10),
        weekday: formatWeekdayShort(date),
      });
    }
  }

  events.sort((a, b) => a.date.localeCompare(b.date) || KIND_ORDER[a.kind] - KIND_ORDER[b.kind]);

  const months: AgendaMonth[] = [];
  for (const event of events) {
    const key = event.date.slice(0, 7);
    let month = months.find((m) => m.key === key);
    if (!month) {
      month = { key, label: formatMonthYear(event.date, { capitalize: true }), events: [] };
      months.push(month);
    }
    month.events.push(event);
  }
  return months;
}
