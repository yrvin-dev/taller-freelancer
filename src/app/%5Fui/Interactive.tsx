'use client';

import { useState } from 'react';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Seg } from '@/components/ui/Seg';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
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
    </div>
  );
}
