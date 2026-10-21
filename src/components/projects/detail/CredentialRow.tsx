'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { deleteCredential, revealCredential } from '@/app/(app)/proyectos/[id]/actions';
import { useActionFeedback } from '@/components/ActionFeedback';
import { Button, buttonClass } from '@/components/ui/Button';
import { ExternalLink } from '@/components/ui/ExternalLink';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { externalHref } from '@/lib/links';
import type { Credential } from '@/lib/projects';
import { DetailRow } from './DetailRows';

/** El secreto se ve 30 s y se vuelve a tapar (03 §seguridad). */
export const REVEAL_MS = 30_000;

// Fila de credencial (02 §8.3). El secreto no está en el HTML: lo trae
// `revealCredential` al pulsar Mostrar o Copiar, y solo vive en el estado del cliente.
export function CredentialRow({
  projectId,
  credential,
}: {
  projectId: string;
  credential: Credential;
}) {
  const toast = useToast();
  const { fail } = useActionFeedback();
  const [secret, setSecret] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const url = externalHref(credential.url);

  useEffect(() => {
    if (secret === null) return;
    const timer = setTimeout(() => setSecret(null), REVEAL_MS);
    return () => clearTimeout(timer);
  }, [secret]);

  async function fetchSecret(): Promise<string | null> {
    setBusy(true);
    const result = await revealCredential({ projectId, credentialId: credential.id });
    setBusy(false);
    if (!result.ok) {
      fail(result);
      return null;
    }
    return result.data.secret;
  }

  async function show() {
    setSecret(await fetchSecret());
  }

  async function copy() {
    const value = secret ?? (await fetchSecret());
    if (value === null) return;
    try {
      await navigator.clipboard.writeText(value);
      toast.show('Contraseña copiada');
    } catch {
      toast.show('No se pudo copiar', 'warning');
    }
  }

  return (
    <DetailRow
      align="center"
      fill
      label={
        <span className="flex flex-col gap-[2px]">
          <span className="flex items-center gap-[calc(var(--space-1)*1.2)]">
            <Icon name="lock" className="text-[17px] text-accent" />
            {credential.label}
          </span>
          {credential.username && <span className="pl-[23px]">{credential.username}</span>}
        </span>
      }
    >
      <span className="min-w-0 flex-[1_1_240px] text-lg [overflow-wrap:anywhere]">
        {secret === null ? (
          <>
            <span className="sr-only">Contraseña oculta</span>
            <span aria-hidden="true" className="font-ui tracking-[0.12em]">
              ••••••••
            </span>
          </>
        ) : (
          <code className="font-mono">{secret}</code>
        )}
      </span>
      <span className="flex gap-1">
        <Button
          variant="ghost"
          loading={busy}
          aria-label={`${secret === null ? 'Mostrar' : 'Ocultar'} contraseña de ${credential.label}`}
          onClick={secret === null ? show : () => setSecret(null)}
        >
          {secret === null ? 'Mostrar' : 'Ocultar'}
        </Button>
        <Button
          variant="ghost"
          icon="copy"
          disabled={busy}
          aria-label={`Copiar contraseña de ${credential.label}`}
          onClick={copy}
        >
          Copiar
        </Button>
        {url && (
          <ExternalLink href={url} className={buttonClass({ variant: 'ghost' })}>
            <Icon name="external" />
            Abrir <span className="sr-only">{credential.label}</span>
          </ExternalLink>
        )}
        <DeleteCredential credential={credential} />
      </span>
    </DetailRow>
  );
}

/** "Borrar" con confirmación en la misma línea, como la bitácora (02 §8.3). */
function DeleteCredential({ credential }: { credential: Credential }) {
  const [asking, setAsking] = useState(false);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const { fail } = useActionFeedback();
  const router = useRouter();

  function remove() {
    startTransition(async () => {
      const result = await deleteCredential(credential.id);
      if (!result.ok) {
        fail(result);
        return;
      }
      toast.show('Credencial borrada');
      router.refresh();
    });
  }

  if (!asking) {
    return (
      <Button
        iconOnly
        icon="trash"
        variant="ghost"
        tone="danger"
        aria-label={`Borrar credencial ${credential.label}`}
        onClick={() => setAsking(true)}
      />
    );
  }
  return (
    <span className="flex items-center gap-2">
      <span className="text-sm text-neutral-700">¿Borrar?</span>
      <Button size="sm" variant="ghost" autoFocus onClick={() => setAsking(false)}>
        No
      </Button>
      <Button size="sm" tone="danger" loading={pending} onClick={remove}>
        Sí, borrar
      </Button>
    </span>
  );
}
