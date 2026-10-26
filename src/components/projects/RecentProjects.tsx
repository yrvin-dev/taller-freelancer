import Image from 'next/image';
import Link from 'next/link';
import { buttonClass } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { StatusDot } from '@/components/ui/StatusDot';
import { TYPE_LABEL } from '@/lib/domain';
import { formatDateShort, toISODateIn } from '@/lib/format';
import type { Project } from '@/lib/projects';
import { isStaticThumbnail } from '@/lib/thumbnails';

/** Miniatura 16:10 (176×110 en desktop, 88×55 en mobile); sin imagen, recuadro neutro. */
function Thumbnail({ project }: { project: Project }) {
  return (
    <div className="relative h-[55px] w-[88px] flex-none overflow-hidden rounded-md bg-neutral-200 shell:h-[110px] shell:w-[176px]">
      {project.thumbnailUrl && (
        <Image
          src={project.thumbnailUrl}
          unoptimized={!isStaticThumbnail(project.thumbnailUrl)}
          alt=""
          fill
          sizes="(min-width: 820px) 176px, 88px"
          className="object-cover"
        />
      )}
    </div>
  );
}

// Portada de "Proyectos recientes" del export.
export function RecentProjects({ projects }: { projects: Project[] }) {
  return (
    <section className="flex flex-col gap-3" aria-labelledby="recientes">
      <div className="flex items-baseline gap-3">
        {/* h2 por jerarquía (va bajo el h1); con el tamaño de h3 del export. */}
        <h2 id="recientes" className="m-0 text-2xl">
          Proyectos recientes
        </h2>
        <Link href="/proyectos" className={buttonClass({ variant: 'ghost' })}>
          Ver todos
        </Link>
      </div>

      <ul className="m-0 flex list-none flex-col p-0">
        {projects.map((project) => {
          const href = `/proyectos/${project.id}`;
          return (
            <li key={project.id} className="flex flex-wrap items-center gap-3 py-3">
              <Thumbnail project={project} />
              <Link
                href={href}
                className="flex min-w-0 flex-[1_1_200px] flex-col justify-center leading-[1.3] text-text no-underline hover:text-text max-sm:min-h-[44px]"
              >
                <span className="font-heading text-[17px] font-semibold">{project.name}</span>
                <span className="text-sm text-neutral-700">
                  {project.client} · {TYPE_LABEL[project.type]} · {project.code}
                </span>
              </Link>
              <StatusDot status={project.status} />
              <span className="min-w-[130px] text-sm text-neutral-700">
                Actualizado {formatDateShort(toISODateIn(new Date(project.updatedAt)))}
              </span>
              <Link
                href={href}
                aria-label={`Abrir ficha de ${project.name}`}
                title="Abrir ficha"
                className={buttonClass({ variant: 'ghost', iconOnly: true })}
              >
                <Icon name="forward" className="text-[18px]" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
