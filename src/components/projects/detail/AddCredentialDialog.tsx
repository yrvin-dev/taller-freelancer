'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useForm, type FieldPath } from 'react-hook-form';
import { addCredential } from '@/app/(app)/proyectos/[id]/actions';
import { useActionFeedback } from '@/components/ActionFeedback';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import {
  credentialInputSchema,
  type CredentialFormValues,
  type CredentialInput,
} from '@/lib/schemas';

const FORM_ID = 'credential-form';

/**
 * "Agregar credencial" (02 §8.3): diálogo con nombre, usuario, contraseña y URL. La
 * contraseña va directo a `addCredential`, que la cifra en el servidor; nunca pasa
 * por el formulario del proyecto ni se guarda en el estado de la página.
 */
export function AddCredentialDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [saving, startSaving] = useTransition();
  const toast = useToast();
  const { fail } = useActionFeedback();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    getValues,
    reset,
    setError,
    formState: { errors },
  } = useForm<CredentialFormValues, unknown, CredentialInput>({
    resolver: zodResolver(credentialInputSchema),
    defaultValues: { projectId, label: '', username: '', url: '', secret: '' },
  });

  function close() {
    setOpen(false);
    reset(); // la contraseña no queda en memoria del formulario
  }

  // Valida en el cliente; al servidor van los valores crudos (los vuelve a validar).
  const submit = handleSubmit(() => {
    startSaving(async () => {
      const result = await addCredential(getValues());
      if (!result.ok) {
        for (const [name, message] of Object.entries(result.fieldErrors ?? {})) {
          setError(name as FieldPath<CredentialFormValues>, { type: 'server', message });
        }
        fail(result);
        return;
      }
      close();
      toast.show('Credencial guardada');
      router.refresh();
    });
  });

  return (
    <>
      <Button variant="secondary" icon="plus" className="self-start" onClick={() => setOpen(true)}>
        Agregar credencial
      </Button>
      <Dialog
        open={open}
        title="Agregar credencial"
        onClose={close}
        body="form"
        actions={
          <>
            <Button variant="ghost" onClick={close} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" form={FORM_ID} loading={saving}>
              {saving ? 'Guardando…' : 'Guardar'}
            </Button>
          </>
        }
      >
        <form id={FORM_ID} noValidate onSubmit={submit} className="flex flex-col gap-3">
          <input type="hidden" {...register('projectId')} />
          <Field label="Nombre *" htmlFor="cred-label" error={errors.label?.message}>
            <Input {...register('label')} placeholder="Sanity Studio" autoComplete="off" />
          </Field>
          <Field label="Usuario" htmlFor="cred-username" error={errors.username?.message}>
            <Input {...register('username')} autoComplete="off" />
          </Field>
          <Field
            label="Contraseña *"
            htmlFor="cred-secret"
            hint="Se guarda cifrada. Solo tú puedes verla."
            error={errors.secret?.message}
          >
            {/* new-password: que el navegador no autocomplete la tuya en el campo del cliente. */}
            <Input {...register('secret')} type="password" autoComplete="new-password" />
          </Field>
          <Field label="URL" htmlFor="cred-url" error={errors.url?.message}>
            <Input {...register('url')} placeholder="admin.cliente.pe" autoComplete="off" />
          </Field>
        </form>
      </Dialog>
    </>
  );
}
