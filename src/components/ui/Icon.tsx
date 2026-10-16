import { cx } from '@/lib/cx';
import { iconClass, type IconName } from '@/lib/icons';

type IconProps = { name: IconName; solid?: boolean; className?: string };

/** Ícono decorativo de UIcons. El texto accesible lo pone el control que lo contiene. */
export function Icon({ name, solid, className }: IconProps) {
  return <i className={cx(iconClass(name, { solid }), className)} aria-hidden="true" />;
}
