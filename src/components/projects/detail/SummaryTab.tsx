import type { ReactNode } from 'react';
import { buttonClass } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { ExternalLink, touchLinkClass } from '@/components/ui/ExternalLink';
import { Icon } from '@/components/ui/Icon';
import { Tag } from '@/components/ui/Tag';
import { cx } from '@/lib/cx';
import { NO_CMS_LABEL } from '@/lib/domain';
import type { IconName } from '@/lib/icons';
import { externalHref } from '@/lib/links';
import type { Project } from '@/lib/projects';

type Glance = { label: string; icon: IconName; value: ReactNode };

function LinkOrDash({ value }: { value: string | undefined }) {
  const href = externalHref(value);
  return href ? (
    <ExternalLink href={href} className={cx('text-lg [overflow-wrap:anywhere]', touchLinkClass)}>
      {value}
    </ExternalLink>
  ) : (
    <span className="text-lg">—</span>
  );
}

/** Los datos "de un vistazo" del export (sin "Editor del CMS": editores es fase 2). */
function glance(project: Project): Glance[] {
  const tech = [...project.stack.frontend, ...project.stack.backend, ...project.stack.db];
  const hosting = project.stack.hosting.join(' + ');

  return [
    {
      label: 'Stack',
      icon: 'stack',
      value: (
        <span className="flex flex-wrap gap-[calc(var(--space-1)*1.2)]">
          {(tech.length ? tech : ['Por definir']).map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </span>
      ),
    },
    {
      label: 'CMS',
      icon: 'database',
      value: <span className="text-lg">{project.cms ?? NO_CMS_LABEL}</span>,
    },
    {
      label: 'Ruta local',
      icon: 'folderOpen',
      value: project.localPath ? (
        <span className="flex min-w-0 items-center gap-1">
          <span className="text-lg [overflow-wrap:anywhere]">{project.localPath}</span>
          <CopyButton
            text={project.localPath}
            message="Ruta copiada"
            ariaLabel="Copiar ruta local"
          />
        </span>
      ) : (
        <span className="text-lg">—</span>
      ),
    },
    {
      label: 'Editar contenido',
      icon: 'edit',
      value: project.cms ? (
        <LinkOrDash value={project.links.cms} />
      ) : (
        <span className="text-lg">No aplica</span>
      ),
    },
    { label: 'Editar diseño', icon: 'design', value: <LinkOrDash value={project.links.design} /> },
    {
      label: 'Sitio en producción',
      icon: 'domain',
      value: <LinkOrDash value={project.links.deploy} />,
    },
    { label: 'Hosting', icon: 'hosting', value: <span className="text-lg">{hosting || '—'}</span> },
  ];
}

// Pestaña "Resumen" del export: descripción, accesos rápidos y datos de un vistazo.
export function SummaryTab({ project }: { project: Project }) {
  const site = externalHref(project.links.deploy);
  const cms = externalHref(project.links.cms);
  const design = externalHref(project.links.design);

  return (
    <div className="flex flex-col gap-6">
      {project.description && (
        <p className="m-0 max-w-[62ch] text-[19px] leading-[1.5]">{project.description}</p>
      )}

      {(site || cms || design || project.localPath) && (
        <div className="flex flex-wrap gap-2">
          {site && (
            <ExternalLink href={site} className={buttonClass()}>
              <Icon name="domain" />
              Abrir sitio
            </ExternalLink>
          )}
          {cms && (
            <ExternalLink href={cms} className={buttonClass({ variant: 'secondary' })}>
              <Icon name="edit" />
              Abrir CMS
            </ExternalLink>
          )}
          {design && (
            <ExternalLink href={design} className={buttonClass({ variant: 'secondary' })}>
              <Icon name="design" />
              Abrir diseño
            </ExternalLink>
          )}
          {project.localPath && (
            <CopyButton
              text={project.localPath}
              message="Ruta copiada"
              ariaLabel="Copiar ruta local"
              label="Copiar ruta local"
              variant="secondary"
            />
          )}
        </div>
      )}

      <dl className="m-0 grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-x-8 gap-y-6">
        {glance(project).map((item) => (
          <div key={item.label} className="flex min-w-0 flex-col gap-[calc(var(--space-1)*1.2)]">
            <dt className="flex items-center gap-[calc(var(--space-1)*1.2)] text-xs uppercase tracking-caps text-neutral-700">
              <Icon name={item.icon} className="text-lg text-accent" />
              {item.label}
            </dt>
            <dd className="m-0 min-w-0">{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
