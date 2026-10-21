import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingStatus, Skeleton } from '@/components/ui/Skeleton';
import { cx } from '@/lib/cx';

// Esqueletos de los `loading.tsx` (02 §8.8). Repiten los contenedores, anchos y
// separaciones de cada página para que al llegar los datos no salte nada. Los títulos
// fijos ("Proyectos", "Calendario"…) se muestran de verdad.

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

function ProjectCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl bg-surface shadow-sm">
      <Skeleton className="aspect-[16/10] rounded-none" />
      <div className="flex flex-col gap-3 p-4">
        <Skeleton className="h-[28px] w-3/4" />
        <TextLine className="w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-[32px] w-[72px] rounded-pill" />
          <Skeleton className="h-[32px] w-[88px] rounded-pill" />
          <Skeleton className="h-[32px] w-[64px] rounded-pill" />
        </div>
      </div>
    </div>
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

export function ProjectsSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <LoadingStatus label="Cargando proyectos…" />
      <PageHeader title="Proyectos" description={<TextLine className="w-[140px]" />} />
      <div className="flex flex-wrap gap-3">
        {lines(4).map((i) => (
          <div key={i} className="flex flex-[0_1_220px] flex-col gap-1">
            <TextLine className="w-[60px] text-xs" />
            <Skeleton className={CONTROL} />
          </div>
        ))}
      </div>
      <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6 p-0">
        {lines(6).map((i) => (
          <li key={i}>
            <ProjectCardSkeleton />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ProjectDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <LoadingStatus label="Cargando el proyecto…" />
      <div className="flex items-center gap-2">
        <Skeleton className={cx(CONTROL, 'w-[120px]')} />
        <span className="ml-auto" />
        <Skeleton className={cx(CONTROL, 'w-[96px]')} />
      </div>
      <div className="flex flex-wrap items-end gap-6">
        <Skeleton className="aspect-[16/10] min-w-[240px] flex-[0_1_400px] rounded-lg" />
        <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-2">
          <TextLine className="w-[120px] text-xs" />
          <Skeleton className="h-[calc(var(--text-4xl)*var(--leading-tight))] w-[min(420px,90%)]" />
          <TextLine className="w-[min(280px,70%)]" />
        </div>
      </div>
      <div className="flex gap-1 shadow-[inset_0_-1px_0_var(--color-divider)]">
        {lines(6).map((i) => (
          <span key={i} className="flex min-h-[44px] items-center px-3">
            <TextLine className="w-[64px]" />
          </span>
        ))}
      </div>
      <div className="flex max-w-[820px] flex-col gap-3">
        {lines(4).map((i) => (
          <TextLine key={i} className={i % 2 ? 'w-2/3' : 'w-full'} />
        ))}
      </div>
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
