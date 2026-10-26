// Filas de Supabase → tipo `Project` de la UI (src/lib/projects.ts). Sin imports de
// servidor: lo usan la capa de datos y los tests de integración.

import type { Database } from '@/lib/database.types';
import type { Project } from '@/lib/projects';
import type { ProjectInput } from '@/lib/schemas';
import { isStoragePath } from '@/lib/thumbnails';

type Tables = Database['public']['Tables'];

/**
 * Lo que se pide a la base para un proyecto. Las credenciales van **sin** las columnas
 * del secreto (`secret_*`): el secreto solo sale por `revealCredential` (regla 6).
 */
export const PROJECT_SELECT = `
  *,
  payments ( id, amount_pen, paid_on, concept ),
  notes ( id, kind, body, noted_on, created_at ),
  credentials ( id, label, username, url )
` as const;

export type ProjectRow = Tables['projects']['Row'] & {
  payments: Pick<Tables['payments']['Row'], 'id' | 'amount_pen' | 'paid_on' | 'concept'>[];
  notes: Pick<Tables['notes']['Row'], 'id' | 'kind' | 'body' | 'noted_on' | 'created_at'>[];
  credentials: Pick<Tables['credentials']['Row'], 'id' | 'label' | 'username' | 'url'>[];
};

/**
 * Miniatura: una ruta de `public/` (seed local) se usa tal cual; una de Storage, con
 * la URL firmada que preparó la capa de datos (`signedThumbnails`). Sin firma, nada.
 */
function thumbnailUrl(path: string | null, signed: ReadonlyMap<string, string>): string | null {
  if (!path) return null;
  return isStoragePath(path) ? (signed.get(path) ?? null) : path;
}

export function toProject(
  row: ProjectRow,
  signedThumbnails: ReadonlyMap<string, string> = new Map(),
): Project {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    client: row.client,
    clientContact: row.client_contact,
    clientEmail: row.client_email,
    clientWhatsapp: row.client_whatsapp,
    clientCountry: row.client_country,
    type: row.type,
    status: row.status,
    isDemo: row.is_demo,
    description: row.description,
    deliveryDate: row.delivery_date,
    stack: {
      frontend: row.stack_frontend,
      backend: row.stack_backend,
      db: row.stack_db,
      hosting: row.stack_hosting,
    },
    cms: row.cms,
    localPath: row.local_path,
    links: Object.fromEntries(
      (
        [
          ['repo', row.link_repo],
          ['deploy', row.link_deploy],
          ['design', row.link_design],
          ['cms', row.link_cms],
          ['panel', row.link_panel],
        ] as const
      ).filter(([, value]) => value),
    ),
    domainName: row.domain_name,
    domainExpires: row.domain_expires,
    domainPending: row.domain_pending,
    hostingExpires: row.hosting_expires,
    // numeric llega como number en supabase-js; se normaliza por si llega como texto.
    budgetPen: row.budget_pen === null ? null : Number(row.budget_pen),
    thumbnailUrl: thumbnailUrl(row.thumbnail_path, signedThumbnails),
    updatedAt: row.updated_at,
    payments: [...row.payments]
      .sort((a, b) => a.paid_on.localeCompare(b.paid_on))
      .map((p) => ({
        id: p.id,
        amountPen: Number(p.amount_pen),
        paidOn: p.paid_on,
        ...(p.concept ? { concept: p.concept } : {}),
      })),
    credentials: row.credentials.map((c) => ({
      id: c.id,
      label: c.label,
      username: c.username,
      url: c.url,
    })),
    // Bitácora: lo más reciente arriba (fecha y, en el mismo día, la última creada).
    notes: [...row.notes]
      .sort(
        (a, b) => b.noted_on.localeCompare(a.noted_on) || b.created_at.localeCompare(a.created_at),
      )
      .map((n) => ({ id: n.id, kind: n.kind, body: n.body, notedOn: n.noted_on })),
  };
}

/**
 * Código automático cuando el formulario lo deja vacío (como el export):
 * "Colegio Guillermo Brown" → `COL-2026`. Sin tildes ni símbolos.
 */
export function autoCode(name: string, year: number): string {
  const letters = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]/g, '')
    .slice(0, 3)
    .toUpperCase();
  return `${letters || 'PRY'}-${year}`;
}

/**
 * Formulario validado (`ProjectInput`) → columnas de `projects`. No toca `owner_id`
 * (lo pone la base con `auth.uid()`), ni `domain_name` ni `thumbnail_path`, que el
 * formulario no edita.
 */
export function toProjectRow(input: ProjectInput, code: string): Tables['projects']['Update'] {
  return {
    code,
    name: input.name,
    client: input.client,
    client_contact: input.clientContact,
    client_email: input.clientEmail,
    client_whatsapp: input.clientWhatsapp,
    client_country: input.clientCountry,
    type: input.type,
    status: input.status,
    description: input.description,
    delivery_date: input.deliveryDate,
    stack_frontend: input.frontend,
    stack_backend: input.backend,
    stack_db: input.db,
    stack_hosting: input.hosting,
    cms: input.cms,
    local_path: input.localPath,
    link_repo: input.linkRepo,
    link_deploy: input.linkDeploy,
    link_cms: input.linkCms,
    link_design: input.linkDesign,
    link_panel: input.linkPanel,
    domain_expires: input.domainExpires,
    domain_pending: input.domainPending,
    hosting_expires: input.hostingExpires,
    budget_pen: input.budgetPen,
  };
}
