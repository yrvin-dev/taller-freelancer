import type { LinkKind, ProjectStatus, ProjectType } from './domain';

// Forma de un proyecto en la UI: la tabla `projects` del 03 en camelCase, con sus
// pagos. Las fechas son `'YYYY-MM-DD'` (columnas `date`); `updatedAt` es ISO completo.
// Cuando existan los tipos generados de Supabase, la capa src/lib/data/* mapea a esto.

export type Payment = { id: string; amountPen: number; paidOn: string; concept?: string };

export type ProjectStack = {
  frontend: string[];
  backend: string[];
  db: string[];
  hosting: string[];
};

/** Enlaces del proyecto (columnas `link_*` del 03), guardados sin protocolo o con él. */
export type ProjectLinks = Partial<Record<LinkKind, string>>;

export type Project = {
  id: string;
  code: string;
  name: string;
  client: string;
  clientContact: string | null;
  clientEmail: string | null;
  clientWhatsapp: string | null;
  clientCountry: string | null;
  type: ProjectType;
  status: ProjectStatus;
  /** Proyecto ficticio de demo, con el prefijo "(F)" en el nombre. */
  isDemo: boolean;
  description: string | null;
  deliveryDate: string | null;
  stack: ProjectStack;
  cms: string | null;
  /** Carpeta del proyecto en la PC del usuario (ej. `D:\Proyectos\clientes\…`). */
  localPath: string | null;
  links: ProjectLinks;
  domainName: string | null;
  domainExpires: string | null;
  /** Dominio todavía por comprar. */
  domainPending: boolean;
  hostingExpires: string | null;
  budgetPen: number | null;
  thumbnailUrl: string | null;
  updatedAt: string;
  payments: Payment[];
};

/** Suma de pagos en soles, redondeada a céntimos (los montos son numeric(10,2)). */
export function paidPen(project: Pick<Project, 'payments'>): number {
  const cents = project.payments.reduce((total, p) => total + Math.round(p.amountPen * 100), 0);
  return cents / 100;
}

/** Las primeras 4 tecnologías (frontend, backend y base de datos), como en el export. */
export function stackChips(project: Pick<Project, 'stack'>, limit = 4): string[] {
  const { frontend, backend, db } = project.stack;
  return [...frontend, ...backend, ...db].slice(0, limit);
}

/** Vista de /proyectos, en la URL como `?vista=tabla` (tarjetas es la de por defecto). */
export const PROJECT_VIEWS = ['tarjetas', 'tabla'] as const;
export type ProjectView = (typeof PROJECT_VIEWS)[number];

export function parseProjectView(value: string | string[] | undefined): ProjectView {
  return value === 'tabla' ? 'tabla' : 'tarjetas';
}

/** Pestañas de la ficha, en la URL como `?tab=` (Resumen es la de por defecto). */
export const PROJECT_TABS = [
  { key: 'resumen', label: 'Resumen' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'stack', label: 'Stack' },
] as const;
export type ProjectTab = (typeof PROJECT_TABS)[number]['key'];

export function parseProjectTab(value: string | string[] | undefined): ProjectTab {
  return PROJECT_TABS.find((tab) => tab.key === value)?.key ?? 'resumen';
}
