import type { Project } from './projects';
import type { ProjectFormValues } from './schemas';

/** Valores de un proyecto nuevo (como el `toForm(null)` del export). */
export const EMPTY_PROJECT_FORM: ProjectFormValues = {
  name: '',
  code: '',
  type: 'landing',
  status: 'en_desarrollo',
  deliveryDate: '',
  description: '',
  client: '',
  clientContact: '',
  clientEmail: '',
  clientWhatsapp: '',
  clientCountry: 'Perú',
  frontend: '',
  backend: '',
  db: '',
  hosting: '',
  cms: '',
  localPath: '',
  linkRepo: '',
  linkDeploy: '',
  linkCms: '',
  linkDesign: '',
  linkPanel: '',
  domainExpires: '',
  hostingExpires: '',
  domainPending: false,
  budgetPen: '',
  advancePen: '',
  firstNote: '',
};

const joined = (list: string[]) => list.join(', ');

/** Proyecto → valores del formulario de edición (el inverso de `projectSchema`). */
export function toFormValues(project: Project): ProjectFormValues {
  return {
    ...EMPTY_PROJECT_FORM,
    name: project.name,
    code: project.code,
    type: project.type,
    status: project.status,
    deliveryDate: project.deliveryDate ?? '',
    description: project.description ?? '',
    client: project.client,
    clientContact: project.clientContact ?? '',
    clientEmail: project.clientEmail ?? '',
    clientWhatsapp: project.clientWhatsapp ?? '',
    clientCountry: project.clientCountry ?? '',
    frontend: joined(project.stack.frontend),
    backend: joined(project.stack.backend),
    db: joined(project.stack.db),
    hosting: joined(project.stack.hosting),
    cms: project.cms ?? '',
    localPath: project.localPath ?? '',
    linkRepo: project.links.repo ?? '',
    linkDeploy: project.links.deploy ?? '',
    linkCms: project.links.cms ?? '',
    linkDesign: project.links.design ?? '',
    linkPanel: project.links.panel ?? '',
    domainExpires: project.domainExpires ?? '',
    hostingExpires: project.hostingExpires ?? '',
    domainPending: project.domainPending,
    budgetPen: project.budgetPen === null ? '' : String(project.budgetPen),
  };
}
