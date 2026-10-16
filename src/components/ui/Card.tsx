import Link from 'next/link';
import type { ReactNode } from 'react';
import { cx } from '@/lib/cx';

type Elevation = 'sm' | 'md' | 'lg';

type CommonProps = {
  elevation?: Elevation;
  /** La card destacada de la pantalla (una sola, 02 §9.1): degradado amarillo → acento. */
  featured?: boolean;
  className?: string;
  children: ReactNode;
};

export type CardProps = CommonProps &
  ({ as?: 'div' | 'article'; href?: never } | { as: 'a'; href: string });

// Portado de `.card` (Broadsheet) + override del export: sin borde, solo sombra.
const BASE = 'flex flex-col gap-2 p-3 rounded-md';

const SHADOW: Record<Elevation, string> = { sm: 'shadow-sm', md: 'shadow-md', lg: 'shadow-lg' };
const HOVER_SHADOW: Record<Elevation, string> = {
  sm: 'hover:shadow-md',
  md: 'hover:shadow-lg',
  lg: 'hover:shadow-lg',
};

export function Card({
  elevation = 'sm',
  featured = false,
  className,
  children,
  ...rest
}: CardProps) {
  const surface = featured
    ? 'bg-featured text-on-accent hover:text-on-accent'
    : 'bg-surface text-text hover:text-text';
  const classes = cx(BASE, SHADOW[elevation], surface, className);

  if (rest.as === 'a') {
    return (
      <Link
        href={rest.href}
        className={cx(
          classes,
          HOVER_SHADOW[elevation],
          'no-underline transition-[box-shadow,transform] duration-200 ease-out hover:-translate-y-px',
          'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
        )}
      >
        {children}
      </Link>
    );
  }

  const Element = rest.as ?? 'div';
  return <Element className={classes}>{children}</Element>;
}
