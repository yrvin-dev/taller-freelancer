import Link from 'next/link';
import { buttonClass } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

// "Tu espacio está listo" del export: la home de una cuenta sin proyectos.
export function HomeEmptyState() {
  return (
    <section className="flex max-w-[720px] flex-col items-start gap-3 rounded-xl bg-surface p-[clamp(24px,4vw,48px)] shadow-sm">
      <span className="grid h-[52px] w-[52px] place-items-center rounded-md bg-accent-100">
        <Icon name="addFolder" className="text-[24px] text-accent-700" />
      </span>
      <h2 className="m-0 text-2xl">Tu espacio está listo</h2>
      <p className="m-0 text-neutral-700">
        Registra tu primer proyecto con su cliente, stack, accesos y pagos. Las entregas,
        vencimientos y saldos aparecerán aquí.
      </p>
      <Link href="/proyectos/nuevo" className={buttonClass()}>
        <Icon name="plus" />
        Crear mi primer proyecto
      </Link>
    </section>
  );
}
