import type { HTMLAttributes, ReactNode } from 'react';
import type { TagVariant } from '@/lib/domain';
import { cx } from '@/lib/cx';

export type TagProps = { tone?: TagVariant; children: ReactNode } & HTMLAttributes<HTMLSpanElement>;

// Portado de `.tag` (Broadsheet), en pill como en el export. Padding 3px 10px.
const BASE =
  'inline-flex items-center rounded-pill text-2xs tracking-[0.02em] ' +
  'py-[calc(var(--space-1)*0.6)] px-2';

// outline: borde en acento y texto en accent-700 (el acento puro no llega a 4.5:1).
const TONE: Record<TagVariant, string> = {
  accent: 'bg-accent-100 text-accent-800',
  'accent-2': 'bg-accent-2-100 text-accent-2-800',
  neutral: 'bg-neutral-100 text-neutral-800',
  outline: 'border border-accent text-accent-700',
};

export function Tag({ tone = 'neutral', className, children, ...rest }: TagProps) {
  return (
    <span className={cx(BASE, TONE[tone], className)} {...rest}>
      {children}
    </span>
  );
}
