'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { cx } from '@/lib/cx';
import { Icon } from './Icon';

type FieldControl = { id: string; describedBy?: string; invalid: boolean };

const FieldContext = createContext<FieldControl | null>(null);

/** Lo usan Input, Select y Textarea para enlazarse al label, la ayuda y el error. */
export function useFieldControl(): FieldControl | null {
  return useContext(FieldContext);
}

export type FieldProps = {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
};

// Portado de `.field > label`. El export no tiene error ni ayuda por campo: su estilo
// está definido en 02 §8 (12px; error en danger-text con ícono, ayuda en --color-label).
export function Field({ label, htmlFor, error, hint, className, children }: FieldProps) {
  const hintId = hint ? `${htmlFor}-hint` : undefined;
  const errorId = error ? `${htmlFor}-error` : undefined;
  const describedBy = cx(hintId, errorId) || undefined;

  return (
    <FieldContext.Provider value={{ id: htmlFor, describedBy, invalid: Boolean(error) }}>
      <div className={cx('flex flex-col', className)}>
        <label htmlFor={htmlFor} className="mb-1 block text-xs text-label">
          {label}
        </label>
        {children}
        {hint && (
          <p id={hintId} className="mb-0 mt-1 text-xs text-label">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} className="mb-0 mt-1 flex items-center gap-1 text-xs text-danger-text">
            <Icon name="warning" />
            {error}
          </p>
        )}
      </div>
    </FieldContext.Provider>
  );
}
