import Image from 'next/image';
import Link from 'next/link';
import { buttonClass } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { StatusDot } from '@/components/ui/StatusDot';
import { Tag } from '@/components/ui/Tag';
import { TYPE_LABEL } from '@/lib/domain';
import { formatDate } from '@/lib/format';
import type { Project } from '@/lib/projects';
import { DeleteProjectButton } from './DeleteProjectButton';

// Cabecera de "03 Ficha del proyecto": barra de acciones y, debajo, miniatura 16:10
// junto al código, tipo, estado, nombre y "cliente · país · Entrega …".
export function ProjectHeader({ project }: { project: Project }) {
  const meta = [
    project.client,
    project.clientCountry,
    project.deliveryDate && `Entrega ${formatDate(project.deliveryDate)}`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <div className="flex items-center gap-2">
        <Link href="/proyectos" className={buttonClass({ variant: 'ghost' })}>
          <Icon name="back" />
          Proyectos
        </Link>
        <span className="ml-auto" />
        <DeleteProjectButton projectId={project.id} projectName={project.name} />
        <Link
          href={`/proyectos/${project.id}/editar`}
          className={buttonClass({ variant: 'secondary' })}
        >
          <Icon name="pencil" />
          Editar
        </Link>
      </div>

      <div className="flex flex-wrap items-end gap-6">
        <div className="relative aspect-[16/10] min-w-[240px] flex-[0_1_400px] overflow-hidden rounded-lg bg-neutral-200 shadow-md">
          {project.thumbnailUrl && (
            <Image
              src={project.thumbnailUrl}
              alt=""
              fill
              priority
              sizes="(min-width: 820px) 400px, 100vw"
              className="object-cover"
            />
          )}
        </div>
        <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-[0.12em] text-accent-700">
              {project.code}
            </span>
            <Tag>{TYPE_LABEL[project.type]}</Tag>
            <StatusDot status={project.status} />
          </div>
          <h1 id="ficha-titulo" className="m-0 text-[46px]">
            {project.name}
          </h1>
          {meta && <span className="text-neutral-700">{meta}</span>}
        </div>
      </div>
    </>
  );
}
