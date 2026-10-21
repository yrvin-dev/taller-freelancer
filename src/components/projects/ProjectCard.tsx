import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { StatusDot } from '@/components/ui/StatusDot';
import { chipColor } from '@/lib/chips';
import { NO_CMS_LABEL, TYPE_LABEL } from '@/lib/domain';
import { stackChips, type Project } from '@/lib/projects';

export type ProjectCardProps = { project: Project };

// Portada de la tarjeta de "02 Proyectos": miniatura 16:10 y, debajo, la parte tintada
// (toda clicable hacia la ficha) con nombre en Nunito 800 en mayúsculas, "tipo · CMS",
// hasta 4 chips de stack con color y el cliente con su estado.
// Padding 22px 24px 18px y gap de chips 8px del export, derivados de los tokens.
//
// El enlace es solo el nombre (su nombre accesible = su texto visible, WCAG 2.5.3) y su
// `::after` cubre la parte tintada, así que se toca igual que antes. El anillo de foco
// va en la tarjeta entera (el `overflow-hidden` recortaría el del enlace).
export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl bg-surface shadow-sm has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent">
      <div className="relative aspect-[16/10] bg-neutral-200">
        {project.thumbnailUrl && (
          <Image
            src={project.thumbnailUrl}
            alt=""
            fill
            sizes="(min-width: 820px) 33vw, 100vw"
            className="object-cover"
          />
        )}
      </div>

      <div className="relative flex flex-1 flex-col gap-2 bg-card-foot px-[calc(var(--space-4)*1.2)] pb-[calc(var(--space-3)*1.2)] pt-[calc(var(--space-4)*1.1)] text-text transition-colors hover:bg-card-foot-hover">
        <span className="flex flex-col gap-1">
          <h2 className="m-0 font-ui text-[26px] font-extrabold uppercase leading-[1.05] tracking-[0.01em]">
            <Link
              href={`/proyectos/${project.id}`}
              className="text-text no-underline after:absolute after:inset-0 hover:text-text focus-visible:outline-none"
            >
              {project.name}
            </Link>
          </h2>
          {/* El export usa neutral-600 (4.44:1 sobre este fondo); neutral-700 pasa AA. */}
          <span className="font-ui text-[18px] text-neutral-700">
            {TYPE_LABEL[project.type]} · {project.cms ?? NO_CMS_LABEL}
          </span>
        </span>

        {stackChips(project).length > 0 && (
          <ul className="m-0 mt-1 flex list-none flex-wrap gap-[calc(var(--space-2)*0.8)] p-0">
            {stackChips(project).map((tech) => (
              <li
                key={tech}
                className="tech-chip whitespace-nowrap rounded-pill px-[calc(var(--space-3)*0.93)] py-[calc(var(--space-1)*1.2)] font-ui text-md font-semibold"
                style={{ '--chip': `var(--chip-${chipColor(tech)})` } as CSSProperties}
              >
                {tech}
              </li>
            ))}
          </ul>
        )}

        <span className="mt-auto flex items-center gap-2 pt-[calc(var(--space-1)*1.2)] text-sm text-neutral-700">
          <span className="min-w-0 flex-1 truncate">{project.client}</span>
          <StatusDot status={project.status} />
        </span>
      </div>
    </article>
  );
}
