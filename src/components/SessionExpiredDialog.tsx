'use client';

import { useEffect, useId, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

export type SessionExpiredDialogProps = {
  open: boolean;
  onRelogin(): void;
  onExit(): void;
};

/**
 * "08 Sesión expirada (401)": modal sobre la app con el fondo desenfocado. A
 * diferencia de `Dialog`, no se cierra con Esc ni con un clic afuera: con la sesión
 * vencida solo se puede volver a entrar o salir. Lo dispara la tanda de auth.
 */
export function SessionExpiredDialog({ open, onRelogin, onExit }: SessionExpiredDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const bodyId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      onCancel={(event) => event.preventDefault()}
      className="m-auto w-[min(420px,calc(100%-2*var(--space-4)))] max-w-none rounded-lg border-0 bg-surface p-0 text-text shadow-lg backdrop:bg-backdrop-soft backdrop:backdrop-blur-[8px]"
    >
      <div className="flex flex-col items-start gap-3 p-6">
        <span className="grid h-[56px] w-[56px] place-items-center rounded-full bg-accent-soft text-accent">
          <Icon name="history" className="text-[24px]" />
        </span>
        <span className="text-sm font-bold tracking-caps text-neutral-700">ERROR 401</span>
        <h2 id={titleId} className="m-0">
          Tu sesión expiró
        </h2>
        <p id={bodyId} className="m-0 text-neutral-700">
          Por seguridad cerramos tu sesión tras un tiempo sin actividad. Vuelve a entrar para seguir
          donde te quedaste.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button icon="google" onClick={onRelogin}>
            Entrar de nuevo con Google
          </Button>
          <Button variant="ghost" onClick={onExit}>
            Salir
          </Button>
        </div>
      </div>
    </dialog>
  );
}
