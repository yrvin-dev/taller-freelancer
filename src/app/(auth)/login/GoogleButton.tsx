'use client';

import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';

/**
 * "Continuar con Google" del export. Hasta la tanda de auth solo avisa con un toast;
 * entonces pasa a `supabase.auth.signInWithOAuth({ provider: 'google' })`.
 */
export function GoogleButton() {
  const toast = useToast();
  return (
    <button
      type="button"
      onClick={() => toast.show('Disponible al conectar Google', 'info')}
      className="flex h-[54px] cursor-pointer items-center justify-center gap-[calc(var(--space-2)*1.2)] rounded-pill border-0 bg-surface font-ui text-lg font-bold text-text shadow-sm transition-[box-shadow,transform] duration-200 ease-out hover:-translate-y-px hover:shadow-md motion-reduce:transition-none"
    >
      <Icon name="google" className="text-[20px] text-accent-2" />
      Continuar con Google
    </button>
  );
}
