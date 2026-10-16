import { cx } from '@/lib/cx';
import type { IconName } from '@/lib/icons';
import { Icon } from './Icon';

export type SegOption<T extends string> = { value: T; label: string; icon?: IconName };

export type SegProps<T extends string> = {
  name: string;
  /** Nombre accesible del grupo ("Vista", "Tema"). */
  label: string;
  value: T;
  options: SegOption<T>[];
  onChange(value: T): void;
};

// Portado de `.seg` / `.seg-opt`: radios ocultos dentro de <label>, así las flechas
// del teclado cambian de opción sin JS extra. Padding 7px 12px y gap 6px del export.
// La opción elegida usa on-accent (no --color-bg, que da 2.2:1 sobre el acento).
const OPTION =
  'relative inline-flex cursor-pointer items-center whitespace-nowrap text-sm max-sm:min-h-[44px] ' +
  'gap-[calc(var(--space-1)*1.2)] py-[calc(var(--space-1)*1.4)] px-[calc(var(--space-2)*1.2)] ' +
  'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent ' +
  'has-[:focus-visible]:-outline-offset-2';

export function Seg<T extends string>({ name, label, value, options, onChange }: SegProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex overflow-hidden rounded-md border border-divider"
    >
      {options.map((option, index) => {
        const checked = option.value === value;
        return (
          <label
            key={option.value}
            className={cx(
              OPTION,
              index > 0 && 'border-l border-divider',
              checked ? 'bg-accent text-on-accent' : 'hover:bg-state-hover',
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={checked}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {option.icon && <Icon name={option.icon} />}
            {option.label}
          </label>
        );
      })}
    </div>
  );
}
