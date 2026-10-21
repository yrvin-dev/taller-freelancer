'use client';

import { useState, useTransition } from 'react';
import { deleteAccount } from '@/app/(app)/cuenta/actions';
import { useActionFeedback } from '@/components/ActionFeedback';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';

/**
 * "Borrar cuenta" del export con su confirmación. Si sale bien, `deleteAccount`
 * cierra la sesión y redirige al login; aquí solo se maneja el error.
 */
export function DeleteAccountButton({ projectCount }: { projectCount: number }) {
  const [open, setOpen] = useState(false);
  const { fail } = useActionFeedback();
  const [pending, startTransition] = useTransition();

  return (
    <>
      <Button variant="ghost" tone="danger" icon="trash" onClick={() => setOpen(true)}>
        Borrar cuenta
      </Button>
      <Dialog
        open={open}
        title="¿Borrar tu cuenta?"
        onClose={() => setOpen(false)}
        actions={
          <>
            <Button variant="secondary" disabled={pending} onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              tone="danger"
              loading={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await deleteAccount();
                  // Solo vuelve si falló: si no, la acción ya redirigió al login.
                  if (!result.ok) fail(result);
                })
              }
            >
              Sí, borrar cuenta
            </Button>
          </>
        }
      >
        Se eliminarán {projectCount} proyectos con sus clientes, pagos y notas. Esta acción no se
        puede deshacer.
      </Dialog>
    </>
  );
}
