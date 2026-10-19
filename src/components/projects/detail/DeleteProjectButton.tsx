'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { archiveProject, deleteProject } from '@/app/(app)/proyectos/[id]/actions';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { useToast } from '@/components/ui/Toast';

/**
 * "Eliminar" del export, con la alternativa de archivar (sacarlo de la vista sin borrar
 * nada). Eliminar lleva a la lista; archivar deja la ficha, ya en "Archivado".
 */
export function DeleteProjectButton({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const router = useRouter();

  function run(action: 'delete' | 'archive') {
    startTransition(async () => {
      const result =
        action === 'delete' ? await deleteProject(projectId) : await archiveProject(projectId);
      if (!result.ok) {
        toast.show(result.error, 'warning');
        return;
      }
      setOpen(false);
      if (action === 'delete') {
        toast.show('Proyecto eliminado');
        router.push('/proyectos');
      } else {
        toast.show('Proyecto archivado');
        router.refresh();
      }
    });
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
            <Button variant="secondary" disabled={pending} onClick={() => run('archive')}>
              Archivar
            </Button>
            <Button variant="ghost" disabled={pending} onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button tone="danger" icon="trash" loading={pending} onClick={() => run('delete')}>
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
