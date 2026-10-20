// Búsqueda y filtros de /proyectos (T19), portados del export. Viven en la URL
// (`?q=&estado=&stack=&cms=`): se comparten y sobreviven a la recarga. Funciones puras:
// el filtrado corre en el servidor sobre la lista ya cargada (ver 03 §6).

import { NO_CMS_LABEL, PROJECT_STATUSES, type ProjectStatus } from './domain';
import type { Project } from './projects';

export const ALL = 'todos';
const MAX_QUERY = 100;

export type ProjectFilters = {
  q: string;
  estado: ProjectStatus | typeof ALL;
  stack: string;
  cms: string;
};

export const NO_FILTERS: ProjectFilters = { q: '', estado: ALL, stack: ALL, cms: ALL };

type RawParams = Record<string, string | string[] | undefined>;

const single = (value: string | string[] | undefined) => (typeof value === 'string' ? value : '');

/** Lee los filtros de la URL. Un valor inválido o repetido se ignora (queda en "todos"). */
export function parseProjectFilters(params: RawParams): ProjectFilters {
  const estado = single(params.estado);
  return {
    q: single(params.q).trim().slice(0, MAX_QUERY),
    estado: (PROJECT_STATUSES as readonly string[]).includes(estado)
      ? (estado as ProjectStatus)
      : ALL,
    stack: single(params.stack).trim() || ALL,
    cms: single(params.cms).trim() || ALL,
  };
}

export function hasActiveFilters(filters: ProjectFilters): boolean {
  return filters.q !== '' || filters.estado !== ALL || filters.stack !== ALL || filters.cms !== ALL;
}

/** "Página" → "pagina": la búsqueda ignora mayúsculas y tildes. */
const normalize = (text: string) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('es');

const techOf = (p: Project) => [
  ...p.stack.frontend,
  ...p.stack.backend,
  ...p.stack.db,
  ...p.stack.hosting,
];

const cmsOf = (p: Project) => p.cms ?? NO_CMS_LABEL;

const byName = (a: string, b: string) => a.localeCompare(b, 'es', { sensitivity: 'base' });

export type FilterResult = {
  filtered: Project[];
  /** Por estado, con los demás filtros aplicados (como el export): "En desarrollo (3)". */
  counts: Record<ProjectStatus | typeof ALL, number>;
  /** Opciones de los desplegables, sacadas de TODOS los proyectos del usuario. */
  stackOptions: string[];
  cmsOptions: string[];
};

export function filterProjects(projects: Project[], filters: ProjectFilters): FilterResult {
  const query = normalize(filters.q);

  // "base": todo menos el estado, para que los contadores digan cuántos hay de cada uno.
  const base = projects.filter(
    (p) =>
      (!query || normalize(`${p.name} ${p.client} ${p.code}`).includes(query)) &&
      (filters.stack === ALL || techOf(p).includes(filters.stack)) &&
      (filters.cms === ALL || cmsOf(p) === filters.cms),
  );

  const counts = Object.fromEntries([
    [ALL, base.length],
    ...PROJECT_STATUSES.map((status) => [status, base.filter((p) => p.status === status).length]),
  ]) as FilterResult['counts'];

  return {
    filtered: filters.estado === ALL ? base : base.filter((p) => p.status === filters.estado),
    counts,
    stackOptions: [...new Set(projects.flatMap(techOf))].sort(byName),
    cmsOptions: [...new Set(projects.map(cmsOf))].sort(byName),
  };
}

/** Filtros (+ vista) → query string, sin los valores por defecto: `?q=agb&vista=tabla`. */
export function filtersQuery(filters: ProjectFilters, vista?: string): string {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.estado !== ALL) params.set('estado', filters.estado);
  if (filters.stack !== ALL) params.set('stack', filters.stack);
  if (filters.cms !== ALL) params.set('cms', filters.cms);
  if (vista && vista !== 'tarjetas') params.set('vista', vista);
  const query = params.toString();
  return query ? `?${query}` : '';
}
