'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Seg } from '@/components/ui/Seg';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { ThemeSwitch } from '@/components/ui/ThemeSwitch';
import { ToastProvider, useToast } from '@/components/ui/Toast';
import { PROJECT_STATUSES, STATUS_META } from '@/lib/domain';

type View = 'tarjetas' | 'tabla';

/** Parte interactiva de la galería /_ui (estado de cliente). `id` evita ids repetidos por tema. */
export function Interactive({ id }: { id: string }) {
  const [view, setView] = useState<View>('tarjetas');

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nombre del proyecto" htmlFor={`${id}-name`}>
          <Input placeholder="Colegio Guillermo Brown" />
        </Field>
        <Field label="Estado" htmlFor={`${id}-status`}>
          <Select defaultValue="en_desarrollo">
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Código" htmlFor={`${id}-code`} hint="Ejemplo: AGB-2026">
          <Input />
        </Field>
        <Field label="Cliente" htmlFor={`${id}-client`} error="Completa el cliente.">
          <Input defaultValue="" />
        </Field>
        <Field label="Deshabilitado" htmlFor={`${id}-disabled`}>
          <Input disabled defaultValue="No editable" />
        </Field>
        <Field label="Descripción" htmlFor={`${id}-desc`} className="sm:col-span-2">
          <Textarea placeholder="Landing institucional con CMS…" />
        </Field>
      </div>

      <Seg<View>
        name={`${id}-view`}
        label="Vista"
        value={view}
        options={[
          { value: 'tarjetas', label: 'Tarjetas', icon: 'apps' },
          { value: 'tabla', label: 'Tabla', icon: 'list' },
        ]}
        onChange={setView}
      />

      <ToastProvider>
        <Overlays />
      </ToastProvider>

      <SwitchDemo />
    </div>
  );
}

// Copia del diálogo "¿Eliminar …?" del export, con sus dos salidas.
function Overlays() {
  const [open, setOpen] = useState(false);
  const toast = useToast();

  function close(message?: string) {
    setOpen(false);
    if (message) toast.show(message);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" tone="danger" icon="trash" onClick={() => setOpen(true)}>
        Eliminar proyecto
      </Button>
      <Button variant="secondary" icon="copy" onClick={() => toast.show('Enlace copiado')}>
        Mostrar toast
      </Button>
      <Dialog
        open={open}
        title="¿Eliminar Colegio Guillermo Brown?"
        onClose={() => close()}
        actions={
          <>
            <Button variant="secondary" onClick={() => close('Proyecto archivado')}>
              Archivar en su lugar
            </Button>
            <Button tone="danger" onClick={() => close('Proyecto eliminado')}>
              Eliminar
            </Button>
          </>
        }
      >
        Se borrará la ficha con sus accesos, pagos y bitácora. Si solo quieres sacarlo de la vista,
        cámbialo a Archivado.
      </Dialog>
    </div>
  );
}

// Solo muestra los dos estados y tamaños; el tema real de la página lo cambia la home.
function SwitchDemo() {
  const [dark, setDark] = useState(false);
  const theme = dark ? 'dark' : 'light';
  const toggle = () => setDark((d) => !d);
  return (
    <div className="flex items-center gap-2">
      <ThemeSwitch theme={theme} onToggle={toggle} size="sm" />
      <ThemeSwitch theme={theme} onToggle={toggle} />
    </div>
  );
}
