import Link from 'next/link';
import { ErrorScreen } from '@/components/ErrorScreen';
import { buttonClass } from '@/components/ui/Button';

/** 404 (02 §8.6): dentro del shell (`(app)/not-found`) y fuera de él (raíz). */
export function NotFoundScreen() {
  return (
    <ErrorScreen
      code={404}
      icon="search"
      title="No encontramos esta página"
      actions={
        <>
          <Link href="/proyectos" className={buttonClass()}>
            Ir a mis proyectos
          </Link>
          <Link href="/" className={buttonClass({ variant: 'secondary' })}>
            Ir al inicio
          </Link>
        </>
      }
    >
      Puede que el enlace esté mal escrito o que el proyecto ya no exista.
    </ErrorScreen>
  );
}
