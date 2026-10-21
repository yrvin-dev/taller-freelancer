import { cx } from '@/lib/cx';

// 02 §8.8 (no está en el export): bloque en neutral-200 que ocupa el lugar del contenido
// mientras la página carga. El pulso vive en globals.css (`.skeleton`) para que
// `prefers-reduced-motion` lo apague.
export function Skeleton({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cx('skeleton block rounded-md bg-neutral-200', className)}
    />
  );
}

/** Lo que anuncia un lector de pantalla mientras carga (los bloques son decorativos). */
export function LoadingStatus({ label }: { label: string }) {
  return (
    <p role="status" className="sr-only">
      {label}
    </p>
  );
}
