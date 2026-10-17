import type { HTMLAttributes, ReactNode } from 'react';
import type { TagVariant } from '@/lib/domain';
import { cx } from '@/lib/cx';

export type TagSize = 'sm' | 'md';

export type TagProps = {
  tone?: TagVariant;
  /** `sm` es el `.tag` del export; `md`, el de la pestaña Stack de la ficha (13px). */
  size?: TagSize;
  children: ReactNode;
} & HTMLAttributes<HTMLSpanElement>;

// Portado de `.tag` (Broadsheet), en pill como en el export.
const BASE = 'inline-flex items-center rounded-pill tracking-[0.02em]';

const SIZE: Record<TagSize, string> = {
  sm: 'text-2xs py-[calc(var(--space-1)*0.6)] px-2', // 11px · 3px 10px
  md: 'text-sm py-1 px-[calc(var(--space-2)*1.2)]', // 13px · 4px 12px (≈ 5px de --space-1)
};

// outline: borde en acento y texto en accent-700 (el acento puro no llega a 4.5:1).
const TONE: Record<TagVariant, string> = {
  accent: 'bg-accent-100 text-accent-800',
  'accent-2': 'bg-accent-2-100 text-accent-2-800',
  neutral: 'bg-neutral-100 text-neutral-800',
  outline: 'border border-accent text-accent-700',
};

export function Tag({ tone = 'neutral', size = 'sm', className, children, ...rest }: TagProps) {
  return (
    <span className={cx(BASE, SIZE[size], TONE[tone], className)} {...rest}>
      {children}
    </span>
  );
}
