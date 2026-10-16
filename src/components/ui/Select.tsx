'use client';

import type { SelectHTMLAttributes } from 'react';
import { cx } from '@/lib/cx';
import { controlClass, singleLineClass, useControlProps } from './Input';

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

/** `<select>` nativo con el estilo de `.input`, como en el export. */
export function Select({ className, children, ...rest }: SelectProps) {
  const a11y = useControlProps(rest);
  return (
    <select {...rest} {...a11y} className={cx(controlClass, singleLineClass, className)}>
      {children}
    </select>
  );
}
