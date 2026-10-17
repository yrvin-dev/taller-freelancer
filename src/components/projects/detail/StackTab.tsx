import { Tag } from '@/components/ui/Tag';
import type { TagVariant } from '@/lib/domain';
import type { Project } from '@/lib/projects';
import { DetailRow, DetailRows } from './DetailRows';

// Pestaña "Stack" del export. El CMS va en `outline`, no en coral (accent-2) como en el
// export: el coral queda para vencido y destructivo (02 §9.6).
export function StackTab({ project }: { project: Project }) {
  const rows: [string, string[], TagVariant][] = [
    ['Frontend', project.stack.frontend, 'accent'],
    ['Backend', project.stack.backend, 'neutral'],
    ['Base de datos', project.stack.db, 'neutral'],
    ['CMS', project.cms ? [project.cms] : [], 'outline'],
    ['Hosting', project.stack.hosting, 'neutral'],
  ];

  return (
    <DetailRows>
      {rows.map(([label, items, tone]) => (
        <DetailRow key={label} label={label} align="center">
          <span className="flex flex-wrap gap-[calc(var(--space-1)*1.2)]">
            {items.length ? (
              items.map((item) => (
                <Tag key={item} tone={tone} size="md">
                  {item}
                </Tag>
              ))
            ) : (
              <Tag size="md">—</Tag>
            )}
          </span>
        </DetailRow>
      ))}
    </DetailRows>
  );
}
