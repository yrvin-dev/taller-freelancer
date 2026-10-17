'use client';

import type { AriaAttributes, ComponentProps } from 'react';
import { cx } from '@/lib/cx';
import { useFieldControl } from './Field';

// Portado de `.input` (Broadsheet): padding 6px 10px, borde divider, hover al 45%,
// foco con borde de acento. La altura mínima la pone cada control (Textarea usa 90px).
export const controlClass =
  'w-full py-[calc(var(--space-1)*1.2)] px-2 text-md text-text caret-accent ' +
  'bg-surface border border-divider rounded-md placeholder:text-placeholder ' +
  'hover:border-state-border-hover focus-visible:border-accent focus-visible:outline-offset-0 ' +
  'aria-[invalid=true]:border-danger disabled:cursor-not-allowed disabled:opacity-[.45]';

export const singleLineClass = 'min-h-[36px] max-sm:min-h-[44px]';

type ControlA11y = Pick<AriaAttributes, 'aria-describedby' | 'aria-invalid'> & { id?: string };

/** Combina las props del control con las del Field que lo contiene (si hay uno). */
export function useControlProps({ id, ...rest }: ControlA11y) {
  const field = useFieldControl();
  return {
    id: id ?? field?.id,
    'aria-describedby': cx(rest['aria-describedby'], field?.describedBy) || undefined,
    'aria-invalid': rest['aria-invalid'] ?? (field?.invalid || undefined),
  };
}

export type InputProps = ComponentProps<'input'>;

export function Input({ className, ...rest }: InputProps) {
  const a11y = useControlProps(rest);
  return <input {...rest} {...a11y} className={cx(controlClass, singleLineClass, className)} />;
}
