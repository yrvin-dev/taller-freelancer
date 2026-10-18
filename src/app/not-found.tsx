import type { Metadata } from 'next';
import { NotFoundScreen } from '@/components/NotFoundScreen';

export const metadata: Metadata = { title: 'Página no encontrada · Taller Freelancer' };

// URLs que no existen: sin el shell de la app.
export default function RootNotFound() {
  return (
    <main className="flex min-h-screen px-page">
      <NotFoundScreen />
    </main>
  );
}
