import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { Tag } from '@/components/ui/Tag';
import { cx } from '@/lib/cx';
import type { TagVariant } from '@/lib/domain';
import type { IconName } from '@/lib/icons';

export type SummaryItem = {
  id: string;
  href: string;
  primary: string;
  secondary?: string;
  badge: string;
  tone: TagVariant;
};

/** Color del ícono: la card destacada, coral (vencimientos) o amarillo (pagos). */
export type SummaryIconTone = 'featured' | 'danger' | 'yellow';

export type SummaryCardProps = {
  title: string;
  icon: IconName;
  iconTone: SummaryIconTone;
  /** Texto chico a la derecha del título ("Por fecha", "Próximos 30 días"). */
  window: string;
  count: number;
  /** Texto junto al número grande ("proyectos", "S/ 14,100"). */
  sub: string;
  items: SummaryItem[];
  /** Una sola por pantalla (02 §9.1): degradado amarillo → acento. */
  featured?: boolean;
};

const ICON_BOX: Record<SummaryIconTone, string> = {
  featured: 'bg-on-accent-chip text-on-accent',
  danger: 'bg-accent-2-100 text-accent-2',
  yellow: 'bg-chip-yellow text-text',
};

// Portada de las cards de resumen del export. Medidas de mobile (padding 20px, número
// de 48px, ícono de 46px) y de desktop ≥ 820px (14px 16px, 34px y 40px). Las cards no
// destacadas van en surface plano (02 §9), sin los degradados sutiles del export.
export function SummaryCard({
  title,
  icon,
  iconTone,
  window,
  count,
  sub,
  items,
  featured = false,
}: SummaryCardProps) {
  const muted = featured ? 'text-on-accent-muted' : 'text-neutral-700';

  return (
    <article
      className={cx(
        'flex flex-col gap-3 rounded-lg p-4 shadow-sm shell:gap-2 shell:px-[calc(var(--space-3)*1.07)] shell:py-[calc(var(--space-3)*0.93)]',
        featured ? 'bg-featured text-on-accent' : 'bg-surface text-text',
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cx(
            'grid h-[46px] w-[46px] flex-none place-items-center rounded-full shell:h-[40px] shell:w-[40px]',
            ICON_BOX[iconTone],
          )}
        >
          <Icon name={icon} className="text-[26px] shell:text-[24px]" />
        </span>
        <h2 className="m-0 flex-1 text-lg">{title}</h2>
        <span className={cx('text-xs', muted)}>{window}</span>
      </div>

      <p className="m-0 flex items-baseline gap-2">
        <span className="font-heading text-[48px] font-semibold leading-none tracking-[-0.03em] shell:text-[34px]">
          {count}
        </span>
        <span className={cx('text-sm', muted)}>{sub}</span>
      </p>

      {items.length > 0 && (
        <ul className="m-0 flex list-none flex-col gap-[2px] p-0">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="-mx-[calc(var(--space-1)*1.2)] flex items-center gap-2 rounded-md px-[calc(var(--space-1)*1.2)] py-[calc(var(--space-2)*0.8)] text-inherit no-underline hover:bg-state-current-hover hover:text-inherit shell:py-[calc(var(--space-1)*0.8)]"
              >
                <span className="flex min-w-0 flex-1 flex-col leading-[1.3]">
                  <span className="text-md font-semibold">{item.primary}</span>
                  {item.secondary && <span className={cx('text-xs', muted)}>{item.secondary}</span>}
                </span>
                <Tag tone={item.tone} className="whitespace-nowrap">
                  {item.badge}
                </Tag>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
