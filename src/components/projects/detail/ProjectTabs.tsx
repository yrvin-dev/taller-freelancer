import Link from 'next/link';
import { cx } from '@/lib/cx';
import { PROJECT_TABS, type ProjectTab } from '@/lib/projects';

// Pestañas del export (subrayado de 2px en acento la activa). Son enlaces: la pestaña
// vive en la URL (`?tab=`), así se comparte y sobrevive a la recarga. El hover usa
// accent-700 (el acento puro no llega a 4.5:1 sobre el fondo).
export function ProjectTabs({ projectId, active }: { projectId: string; active: ProjectTab }) {
  return (
    <nav aria-label="Secciones del proyecto">
      <ul className="m-0 flex list-none gap-1 overflow-x-auto p-0 shadow-[inset_0_-1px_0_var(--color-divider)]">
        {PROJECT_TABS.map((tab) => {
          const isActive = tab.key === active;
          const href =
            tab.key === 'resumen'
              ? `/proyectos/${projectId}`
              : `/proyectos/${projectId}?tab=${tab.key}`;
          return (
            <li key={tab.key}>
              <Link
                href={href}
                scroll={false}
                aria-current={isActive ? 'page' : undefined}
                className={cx(
                  'flex min-h-[44px] items-center whitespace-nowrap px-3 py-2 text-base no-underline hover:text-accent-700',
                  isActive
                    ? 'font-semibold text-accent-700 shadow-[inset_0_-2px_0_var(--color-accent)]'
                    : 'text-text',
                )}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
