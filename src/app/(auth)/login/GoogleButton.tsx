'use client';

import { useFormStatus } from 'react-dom';
import { Icon } from '@/components/ui/Icon';

/**
 * "Continuar con Google" del export. Es el botón de envío del formulario del login
 * (Server Action `signInWithGoogle`): funciona sin JavaScript y muestra "Conectando…"
 * mientras redirige.
 */
export function GoogleButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending || undefined}
      className="flex h-[54px] w-full cursor-pointer items-center justify-center gap-[calc(var(--space-2)*1.2)] rounded-pill border-0 bg-surface font-ui text-lg font-bold text-text shadow-sm transition-[box-shadow,transform] duration-200 ease-out enabled:hover:-translate-y-px enabled:hover:shadow-md disabled:cursor-wait disabled:opacity-[.45] motion-reduce:transition-none"
    >
      <Icon name="google" className="text-[20px] text-accent-2" />
      {pending ? 'Conectando…' : 'Continuar con Google'}
    </button>
  );
}
