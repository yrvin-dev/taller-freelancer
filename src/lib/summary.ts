// Lógica del panel de inicio (las 3 SummaryCard), portada del export. Funciones puras:
// reciben `today` para que los badges ("en 3 días", "Comprar") se calculen y se testeen.

import { daysUntil } from './format';
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
