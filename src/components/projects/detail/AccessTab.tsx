import { buttonClass } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { ExternalLink } from '@/components/ui/ExternalLink';
import { Icon } from '@/components/ui/Icon';
import { Tag } from '@/components/ui/Tag';
import type { IconName } from '@/lib/icons';
import { externalHref } from '@/lib/links';
import type { Project } from '@/lib/projects';
import { expiryCards } from '@/lib/summary';
import { CredentialRow } from './CredentialRow';
import { DetailRow, DetailRows } from './DetailRows';

type AccessRow = { label: string; icon: IconName; value: string | null | undefined; link: boolean };

// Pestaña "Accesos" del export: enlaces con Abrir/Copiar, Credenciales (02 §8.3) y
// las tarjetas de Vencimientos.
export function AccessTab({ project, today }: { project: Project; today: Date }) {
  const rows: AccessRow[] = [
    { label: 'Ruta local', icon: 'folderOpen', value: project.localPath, link: false },
    { label: 'Repositorio', icon: 'repo', value: project.links.repo, link: true },
    { label: 'Sitio en producción', icon: 'domain', value: project.links.deploy, link: true },
    { label: 'Link del CMS', icon: 'edit', value: project.links.cms, link: true },
    { label: 'Link del diseño', icon: 'design', value: project.links.design, link: true },
    { label: 'Panel de hosting', icon: 'hosting', value: project.links.panel, link: true },
  ];

  return (
    <div className="flex flex-col gap-6">
      <DetailRows wide>
        {rows.map((row) => {
          const href = row.link ? externalHref(row.value) : null;
          return (
            <DetailRow
              key={row.label}
              align="center"
              fill
              label={
                <>
                  <Icon name={row.icon} className="text-[17px] text-accent" />
                  {row.label}
                </>
              }
            >
              <span className="min-w-0 flex-[1_1_240px] text-lg [overflow-wrap:anywhere]">
                {row.value || '—'}
              </span>
              <span className="flex gap-1">
                {href && (
                  <ExternalLink href={href} className={buttonClass({ variant: 'ghost' })}>
                    <Icon name="external" />
                    Abrir <span className="sr-only">{row.label}</span>
                  </ExternalLink>
                )}
                {row.value && (
                  <CopyButton
                    text={row.value}
                    label="Copiar"
                    ariaLabel={`Copiar ${row.label}`}
                    message={row.link ? 'Enlace copiado' : 'Ruta copiada'}
                  />
                )}
              </span>
            </DetailRow>
          );
        })}
      </DetailRows>

      <section className="flex flex-col gap-3" aria-labelledby="credenciales">
        <h2 id="credenciales" className="m-0 text-xl">
          Credenciales
        </h2>
        {project.credentials.length > 0 ? (
          <DetailRows wide>
            {project.credentials.map((credential) => (
              <CredentialRow key={credential.id} projectId={project.id} credential={credential} />
            ))}
          </DetailRows>
        ) : (
          <p className="m-0 text-neutral-700">
            Sin credenciales guardadas. Agrégalas desde Editar.
          </p>
        )}
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="vencimientos">
        <h2 id="vencimientos" className="m-0 text-xl">
          Vencimientos
        </h2>
        <div className="flex flex-wrap gap-4">
          {expiryCards(project, today).map((card) => (
            <div
              key={card.label}
              className="flex flex-[1_1_240px] flex-col gap-2 rounded-lg bg-surface p-4 shadow-sm"
            >
              {/* Kicker en accent-700: el accent de .card-kicker en 10px no llega a AA. */}
              <span className="text-[10px] uppercase tracking-[0.1em] text-accent-700">
                {card.label}
              </span>
              <span className="font-heading text-[24px] font-semibold">{card.date}</span>
              <Tag tone={card.tone} className="self-start">
                {card.status}
              </Tag>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
