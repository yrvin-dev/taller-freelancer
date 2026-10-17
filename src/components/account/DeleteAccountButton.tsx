'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { useToast } from '@/components/ui/Toast';

/** "Borrar cuenta" del export con su confirmación. Avisa hasta conectar la base. */
export function DeleteAccountButton({ projectCount }: { projectCount: number }) {
  const [open, setOpen] = useState(false);
  const toast = useToast();

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
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              tone="danger"
              onClick={() => {
                setOpen(false);
                toast.show('Disponible al conectar la base de datos', 'info');
              }}
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
