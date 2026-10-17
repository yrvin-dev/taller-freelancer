'use client';

import { cx } from '@/lib/cx';
import { buttonClass } from './Button';
import { Icon } from './Icon';
import { useToast } from './Toast';

export type CopyButtonProps = {
  text: string;
  /** Aviso al copiar, como en el export ("Ruta copiada"). */
  message: string;
  /**
   * Nombre accesible. Con `label` visible debe contenerlo ("Copiar" → "Copiar
   * Repositorio"), para distinguir botones repetidos sin romper WCAG 2.5.3.
   */
  ariaLabel: string;
  label?: string;
  variant?: 'secondary' | 'ghost';
  className?: string;
};

/** Copia al portapapeles y confirma con un toast. */
export function CopyButton({
  text,
  message,
  ariaLabel,
  label,
  variant = 'ghost',
  className,
}: CopyButtonProps) {
  const toast = useToast();

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      toast.show(message);
    } catch {
      toast.show('No se pudo copiar', 'warning');
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={ariaLabel}
      title={label ? undefined : ariaLabel}
      className={cx(buttonClass({ variant, iconOnly: !label }), className)}
    >
      <Icon name="copy" />
      {label}
    </button>
  );
}
