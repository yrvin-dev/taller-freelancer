import { STATUS_META, type ProjectStatus } from '@/lib/domain';
import { Tag } from './Tag';

export type StatusDotProps = { status: ProjectStatus };

/** Estado del proyecto: tag con un punto de color y el label. */
export function StatusDot({ status }: StatusDotProps) {
  const meta = STATUS_META[status];
  return (
    <Tag tone={meta.tag} className="gap-[calc(var(--space-1)*1.2)] whitespace-nowrap">
      <span
        className="h-[7px] w-[7px] flex-none rounded-full"
        style={{ background: meta.color }}
        aria-hidden="true"
      />
      {meta.label}
    </Tag>
  );
}
