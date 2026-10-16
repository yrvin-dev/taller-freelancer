import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '@/lib/cx';
import type { IconName } from '@/lib/icons';
import { Icon } from './Icon';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md';
export type ButtonTone = 'default' | 'danger';

type ButtonStyle = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  tone?: ButtonTone;
  iconOnly?: boolean;
};

// Portado de `.btn` (Broadsheet) + overrides del export. Gap 6px y padding 18px
// salen de los tokens igual que en el export: calc(var(--space-*) * n).
const BASE =
  'inline-flex items-center justify-center gap-[calc(var(--space-1)*1.2)] cursor-pointer no-underline ' +
  'font-heading leading-control border border-transparent rounded-md ' +
  'disabled:cursor-not-allowed disabled:opacity-[.45] max-sm:min-h-[44px]';

const SIZE: Record<ButtonSize, string> = {
  md: 'text-md py-2',
  sm: 'text-sm h-[32px]',
};

// El ghost reduce el padding horizontal a --space-1 (como `.btn-ghost`).
const PAD_X: Record<ButtonSize, string> = {
  md: 'px-[calc(var(--space-3)*1.2)]',
  sm: 'px-[calc(var(--space-2)*1.2)]',
};

const ICON_ONLY: Record<ButtonSize, string> = {
  md: 'text-md h-[36px] w-[36px] p-0 max-sm:min-w-[44px]',
  sm: 'text-sm h-[32px] w-[32px] p-0 max-sm:min-w-[44px]',
};

// Peso: 600 (heading) y 700 en el primario, como el export.
// El texto ghost usa accent-700 (no accent, 2.77:1 sobre blanco) para cumplir AA.
const VARIANT: Record<ButtonTone, Record<ButtonVariant, string>> = {
  default: {
    primary:
      'bg-accent text-on-accent font-bold hover:text-on-accent ' +
      'enabled:hover:bg-accent-600 enabled:active:bg-accent-700',
    secondary:
      'font-semibold border-divider text-text hover:text-text ' +
      'enabled:hover:bg-state-hover enabled:active:bg-state-pressed',
    ghost:
      'font-semibold text-accent-700 hover:text-accent-700 ' +
      'enabled:hover:bg-state-accent-hover enabled:active:bg-state-accent-pressed',
  },
  danger: {
    primary:
      'bg-danger text-on-danger font-bold hover:text-on-danger ' +
      'enabled:hover:bg-danger-hover enabled:active:bg-danger-pressed',
    secondary:
      'font-semibold border-divider text-danger-text hover:text-danger-text ' +
      'enabled:hover:bg-state-hover enabled:active:bg-state-pressed',
    ghost:
      'font-semibold text-danger-text hover:text-danger-text ' +
      'enabled:hover:bg-state-hover enabled:active:bg-state-pressed',
  },
};

/** Clases de botón, para aplicarlas también a un `<Link>`. */
export function buttonClass({
  variant = 'primary',
  size = 'md',
  tone = 'default',
  iconOnly = false,
}: ButtonStyle = {}): string {
  const box = iconOnly
    ? ICON_ONLY[size]
    : cx(SIZE[size], variant === 'ghost' ? 'px-1' : PAD_X[size]);
  return cx(BASE, box, VARIANT[tone][variant]);
}

type BaseProps = Omit<ButtonStyle, 'iconOnly'> & {
  icon?: IconName;
  loading?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;

// Un botón solo-ícono no tiene texto visible: el tipo exige `aria-label`.
export type ButtonProps = BaseProps &
  (
    | { iconOnly?: false; children: ReactNode }
    | { iconOnly: true; icon: IconName; 'aria-label': string; children?: never }
  );

/**
 * `loading` deshabilita el botón y marca `aria-busy`. Como en el export, no hay
 * spinner: quien lo usa cambia el texto ("Entrando…").
 */
export function Button({
  variant,
  size,
  tone,
  iconOnly,
  icon,
  loading = false,
  disabled,
  type = 'button',
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(buttonClass({ variant, size, tone, iconOnly }), className)}
      {...rest}
    >
      {icon && <Icon name={icon} />}
      {children}
    </button>
  );
}
