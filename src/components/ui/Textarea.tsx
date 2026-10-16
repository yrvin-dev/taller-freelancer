'use client';

import type { TextareaHTMLAttributes } from 'react';
import { cx } from '@/lib/cx';
import { controlClass, useControlProps } from './Input';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

// `textarea.input` del export: mínimo 90px y solo redimensionable en vertical.
export function Textarea({ className, ...rest }: TextareaProps) {
  const a11y = useControlProps(rest);
  return (
    <textarea
      {...rest}
      {...a11y}
      className={cx(controlClass, 'min-h-[90px] resize-y', className)}
    />
  );
}
