import Image from 'next/image';
import Link from 'next/link';
import { buttonClass } from '@/components/ui/Button';
import { StatusDot } from '@/components/ui/StatusDot';
import { Td, Tr } from '@/components/ui/Table';
import { Tag } from '@/components/ui/Tag';
import { NO_CMS_LABEL, TYPE_LABEL } from '@/lib/domain';
import { formatDate } from '@/lib/format';
import { stackChips, type Project } from '@/lib/projects';
import { isStaticThumbnail } from '@/lib/thumbnails';

export type ProjectRowProps = { project: Project };

// Portada de la fila de la tabla de "02 Proyectos". Miniatura de 120×76 en desktop
// y 60×38 en mobile.
export function ProjectRow({ project }: ProjectRowProps) {
  return (
    <Tr>
      <Td>
        <div className="flex items-center gap-2">
          <div className="relative h-[38px] w-[60px] flex-none overflow-hidden rounded-sm bg-neutral-200 shell:h-[76px] shell:w-[120px]">
            {project.thumbnailUrl && (
              <Image
                src={project.thumbnailUrl}
                unoptimized={!isStaticThumbnail(project.thumbnailUrl)}
                alt=""
                fill
                sizes="(min-width: 820px) 120px, 60px"
                className="object-cover"
              />
            )}
          </div>
          <div className="flex flex-col leading-[1.25]">
            <span className="font-semibold">{project.name}</span>
            <span className="text-xs text-neutral-700">{project.code}</span>
          </div>
        </div>
      </Td>
      <Td>{project.client}</Td>
      <Td>{TYPE_LABEL[project.type]}</Td>
      <Td>
        <StatusDot status={project.status} />
      </Td>
      <Td>
        <div className="flex flex-wrap gap-1">
          {stackChips(project).map((tech) => (
            <Tag key={tech}>{tech}</Tag>
          ))}
        </div>
      </Td>
      <Td>{project.cms ?? NO_CMS_LABEL}</Td>
      <Td className="whitespace-nowrap">{formatDate(project.deliveryDate)}</Td>
      <Td>
        {/* "Abrir" se repite en cada fila: el nombre oculto lo distingue al lector. */}
        <Link href={`/proyectos/${project.id}`} className={buttonClass({ variant: 'ghost' })}>
          Abrir <span className="sr-only">{project.name}</span>
        </Link>
      </Td>
    </Tr>
  );
}
