import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingStatus, Skeleton } from '@/components/ui/Skeleton';
import { cx } from '@/lib/cx';

// Esqueletos de los `loading.tsx` (02 §8.8). Repiten los contenedores, anchos y
// separaciones de cada página para que al llegar los datos no salte nada. Los títulos
// fijos ("Calendario", "Cuenta"…) se muestran de verdad.
//
// "Proyectos" y la ficha no tienen esqueleto: un `loading.tsx` por encima de una página
// que navega solo por `searchParams` (filtros, vista, pestañas) cuelga esa navegación
// en producción (Next 15.5, T22). Lo vigila `tests/unit/loading-boundaries.test.ts`.

const lines = (n: number) => Array.from({ length: n }, (_, i) => i);

/** Alto de Input/Select (`singleLineClass`): 36px, y 44px en mobile. */
const CONTROL = 'h-[36px] max-sm:h-[44px]';

/** Alto de una línea de texto: el bloque ocupa lo mismo que el texto que reemplaza. */
function TextLine({ className }: { className?: string }) {
  return <Skeleton className={cx('h-[1lh]', className)} />;
}

function HeaderSkeleton() {
  return (
    <header className="flex flex-wrap items-end gap-4">
      <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-2">
        <Skeleton className="h-[calc(var(--text-4xl)*var(--leading-tight))] w-[min(360px,90%)]" />
        <TextLine className="w-[min(260px,70%)]" />
      </div>
    </header>
  );
}

function RowsSkeleton({ rows, lead = 'w-[56px]' }: { rows: number; lead?: string }) {
  return (
    <ul className="m-0 flex list-none flex-col p-0">
      {lines(rows).map((i) => (
        <li key={i} className="flex items-center gap-4 py-3">
          <Skeleton className={cx('h-[40px] flex-none', lead)} />
          <span className="flex flex-1 flex-col gap-1">
            <TextLine className="w-[min(320px,80%)]" />
            <TextLine className="w-[min(200px,50%)]" />
          </span>
        </li>
      ))}
    </ul>
  );
}

export function HomeSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true">
      <LoadingStatus label="Cargando el inicio…" />
      <HeaderSkeleton />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(270px,1fr))] gap-4">
        {lines(3).map((i) => (
          <div key={i} className="flex flex-col gap-3 rounded-lg bg-surface p-4 shadow-sm">
            <TextLine className="w-1/2" />
            <Skeleton className="h-[48px] w-[96px]" />
            <TextLine className="w-3/4" />
          </div>
        ))}
      </div>
      <RowsSkeleton rows={3} lead="w-[88px] h-[55px]" />
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div className="flex max-w-[820px] flex-col gap-6" aria-busy="true">
      <LoadingStatus label="Cargando el calendario…" />
      <PageHeader title="Calendario" description={<TextLine className="w-[260px]" />} />
      <section className="flex flex-col">
        <Skeleton className="mb-2 h-[calc(var(--text-2xl)*var(--leading-tight))] w-[180px]" />
        <RowsSkeleton rows={4} />
      </section>
    </div>
  );
}

export function AccountSkeleton() {
  return (
    <div className="flex max-w-[680px] flex-col gap-8" aria-busy="true">
      <LoadingStatus label="Cargando tu cuenta…" />
      <h1 className="m-0">Cuenta</h1>
      <div className="flex items-center gap-4 rounded-lg bg-surface p-6 shadow-sm">
        <Skeleton className="h-[56px] w-[56px] flex-none rounded-full" />
        <span className="flex flex-1 flex-col gap-1">
          <TextLine className="w-[180px]" />
          <TextLine className="w-[240px]" />
        </span>
      </div>
      <div className="flex flex-col gap-4">
        {lines(2).map((i) => (
          <div key={i} className="flex flex-col gap-1">
            <TextLine className="w-[160px] text-xs" />
            <Skeleton className={CONTROL} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProjectFormSkeleton() {
  return (
    <div className="flex max-w-[820px] flex-col gap-6" aria-busy="true">
      <LoadingStatus label="Cargando el formulario…" />
      <HeaderSkeleton />
      {lines(5).map((i) => (
        <div key={i} className="flex flex-col gap-1">
          <TextLine className="w-[140px] text-xs" />
          <Skeleton className={CONTROL} />
        </div>
      ))}
    </div>
  );
}
