'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { ErrorScreen } from '@/components/ErrorScreen';
import { Button, buttonClass } from '@/components/ui/Button';

// Error inesperado dentro de la app (02 §8.6). `reset` vuelve a renderizar el segmento.
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Solo el digest y el mensaje: nunca datos del usuario (Sentry llega en fase 2).
    console.error('Error en la app', error.digest ?? error.message);
  }, [error]);

  return (
    <ErrorScreen
      icon="warning"
      title="Algo salió mal"
      actions={
        <>
          <Button onClick={reset}>Reintentar</Button>
          <Link href="/" className={buttonClass({ variant: 'secondary' })}>
            Ir al inicio
          </Link>
        </>
      }
    >
      No pudimos cargar esta pantalla. Vuelve a intentarlo; si sigue fallando, recarga la página.
    </ErrorScreen>
  );
}
