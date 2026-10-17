'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { useToast } from '@/components/ui/Toast';

/**
 * "Eliminar" del export, con la alternativa de archivar. Hasta la tanda de datos no
 * borra ni archiva: avisa con un toast (con la base: Server Actions + revalidatePath).
 */
export function DeleteProjectButton({ projectName }: { projectName: string }) {
  const [open, setOpen] = useState(false);
  const toast = useToast();

  function pending() {
    setOpen(false);
    toast.show('Disponible al conectar la base de datos', 'info');
  }

  return (
    <>
      <Button variant="ghost" tone="danger" icon="trash" onClick={() => setOpen(true)}>
        Eliminar
      </Button>
      <Dialog
        open={open}
        title={`¿Eliminar ${projectName}?`}
        onClose={() => setOpen(false)}
        actions={
          <>
            <Button variant="secondary" onClick={pending}>
              Archivar
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button tone="danger" icon="trash" onClick={pending}>
              Eliminar
            </Button>
          </>
        }
      >
        Se borrará la ficha con sus accesos, pagos y bitácora. Si solo quieres sacarlo de la vista,
        cámbialo a Archivado.
      </Dialog>
    </>
  );
}
