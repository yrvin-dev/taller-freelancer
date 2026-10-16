// Fuente única de enums, labels y colores del dominio.
// Los valores replican los enums de Postgres (docs/03-arquitectura.md §5).

// ── Estado del proyecto ─────────────────────────────────────────────
export const PROJECT_STATUSES = [
  'en_desarrollo',
  'revision',
  'produccion',
  'mantenimiento',
  'archivado',
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export type TagVariant = 'accent' | 'accent-2' | 'neutral' | 'outline';

type StatusMeta = { label: string; tag: TagVariant; color: string };

// El acento solo marca "En desarrollo"; el coral (accent-2) queda para vencido o
// destructivo (02 §9.6), por eso Mantenimiento usa tag neutral y --status-maint.
export const STATUS_META: Record<ProjectStatus, StatusMeta> = {
  en_desarrollo: { label: 'En desarrollo', tag: 'accent', color: 'var(--status-dev)' },
  revision: { label: 'Revisión', tag: 'neutral', color: 'var(--status-review)' },
  produccion: { label: 'Producción', tag: 'neutral', color: 'var(--status-prod)' },
  mantenimiento: { label: 'Mantenimiento', tag: 'neutral', color: 'var(--status-maint)' },
  archivado: { label: 'Archivado', tag: 'neutral', color: 'var(--status-archived)' },
};

// ── Tipo de proyecto ────────────────────────────────────────────────
export const PROJECT_TYPES = [
  'landing',
  'ecommerce',
  'dashboard',
  'institucional',
  'webapp',
  'otro',
] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export const TYPE_LABEL: Record<ProjectType, string> = {
  landing: 'Landing',
  ecommerce: 'E-commerce',
  dashboard: 'Dashboard',
  institucional: 'Institucional',
  webapp: 'Web app',
  otro: 'Otro',
};

// ── Bitácora ────────────────────────────────────────────────────────
export const NOTE_KINDS = ['pedido', 'cambio', 'nota'] as const;
export type NoteKind = (typeof NOTE_KINDS)[number];

export const NOTE_KIND_LABEL: Record<NoteKind, string> = {
  pedido: 'Pedido',
  cambio: 'Cambio',
  nota: 'Nota',
};

// ── Enlaces del proyecto ────────────────────────────────────────────
export const LINK_KINDS = ['repo', 'deploy', 'design', 'cms', 'panel'] as const;
export type LinkKind = (typeof LINK_KINDS)[number];

export const LINK_LABEL: Record<LinkKind, string> = {
  repo: 'Repositorio',
  deploy: 'Deploy',
  design: 'Diseño',
  cms: 'CMS',
  panel: 'Panel',
};

// ── CMS ─────────────────────────────────────────────────────────────
// `projects.cms` es texto libre y nullable: null se muestra como NO_CMS_LABEL.
export const CMS_OPTIONS = [
  'Sanity',
  'Strapi 5',
  'WordPress',
  'Decap CMS',
  'Webflow',
  'Otro',
] as const;
export const NO_CMS_LABEL = 'Sin CMS';
