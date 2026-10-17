'use client';

import type { ComponentProps } from 'react';
import { cx } from '@/lib/cx';
import { controlClass, useControlProps } from './Input';

export type TextareaProps = ComponentProps<'textarea'> & {
  /** 70px en vez de 90px (la bitácora del export). */
  compact?: boolean;
};

// `textarea.input` del export: mínimo 90px y solo redimensionable en vertical.
export function Textarea({ className, compact = false, ...rest }: TextareaProps) {
  const a11y = useControlProps(rest);
  return (
    <textarea
      {...rest}
      {...a11y}
      className={cx(controlClass, compact ? 'min-h-[70px]' : 'min-h-[90px]', 'resize-y', className)}
    />
  );
}
