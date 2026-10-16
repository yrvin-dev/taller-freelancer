import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { buttonClass } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

// Contenido real (saludo, SummaryCards, recientes) en la tanda de la home.
export default function Home() {
  return (
    <PageHeader
      title="Inicio"
      actions={
        <Link href="/proyectos/nuevo" className={buttonClass()}>
          <Icon name="plus" />
          Nuevo proyecto
        </Link>
      }
    />
  );
}
