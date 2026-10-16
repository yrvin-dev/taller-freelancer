'use client';

import { useEffect, useId, useRef, type MouseEvent, type ReactNode } from 'react';

export type DialogProps = {
  open: boolean;
  title: string;
  onClose(): void;
  children: ReactNode;
  actions?: ReactNode;
};

/**
 * Diálogo modal sobre <dialog> nativo: `showModal()` atrapa el foco, deja inerte el
 * resto de la página, cierra con Esc y devuelve el foco al control que lo abrió.
 * Es controlado: Esc y el clic en el fondo llaman a `onClose`; el padre cambia `open`.
 */
export function Dialog({ open, title, onClose, children, actions }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Si se desmonta abierto, lo cierra para liberar el top layer.
  useEffect(() => {
    const dialog = ref.current;
    return () => dialog?.close();
  }, []);

  // El clic en el ::backdrop llega con target = <dialog>; el contenido va en un div
  // interno con el padding, así un clic dentro nunca tiene como target al <dialog>.
  function handleClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) onClose();
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={handleClick}
      className="m-auto w-[min(440px,calc(100%-2*var(--space-4)))] max-w-none rounded-lg border-0 bg-surface p-0 text-text shadow-lg backdrop:bg-backdrop"
    >
      {/* Portado de `.dialog` (Broadsheet): gap 15px, padding 20px. */}
      <div className="flex flex-col gap-3 p-4">
        <h3 id={titleId} className="m-0 text-xl">
          {title}
        </h3>
        <div className="text-md opacity-[.85]">{children}</div>
        {actions && <div className="mt-2 flex flex-wrap justify-end gap-2">{actions}</div>}
      </div>
    </dialog>
  );
}
