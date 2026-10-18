import type { Metadata } from 'next';
import Link from 'next/link';
import { ErrorScreen } from '@/components/ErrorScreen';
import { buttonClass } from '@/components/ui/Button';

export const metadata: Metadata = { title: 'Sin acceso · Taller Freelancer', robots: 'noindex' };

// "07 Sin acceso (403)". Con la base, la ficha de un proyecto ajeno (RLS no lo
// devuelve) redirige aquí.
export default function ForbiddenPage() {
  return (
    <ErrorScreen
      code={403}
      icon="lock"
      title="No tienes acceso a este proyecto"
      actions={
        <>
          <Link href="/proyectos" className={buttonClass()}>
            Ir a mis proyectos
          </Link>
          {/* La ruta /auth/signout se crea en la tanda de auth. */}
          <form action="/auth/signout" method="post">
            <button type="submit" className={buttonClass({ variant: 'secondary' })}>
              Cambiar de cuenta
            </button>
          </form>
        </>
      }
    >
      Este proyecto pertenece a otra cuenta. Si crees que es un error, revisa que entraste con el
      correo correcto.
    </ErrorScreen>
  );
}
