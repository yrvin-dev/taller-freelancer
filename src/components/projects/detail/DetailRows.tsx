import type { ReactNode } from 'react';
import { cx } from '@/lib/cx';

// Filas "etiqueta · valor" de las pestañas Cliente, Stack y Accesos del export:
// etiqueta de 170px en 13px y el valor al lado; en mobile se apilan.

export function DetailRows({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <dl className={cx('m-0 flex flex-col', wide ? 'max-w-[900px]' : 'max-w-[720px]')}>
      {children}
    </dl>
  );
}

export function DetailRow({
  label,
  children,
  align = 'baseline',
  fill = false,
}: {
  label: ReactNode;
  children: ReactNode;
  align?: 'baseline' | 'center';
  /** El valor ocupa el resto de la fila (Accesos: valor + acciones a la derecha). */
  fill?: boolean;
}) {
  return (
    <div
      className={cx(
        'flex flex-wrap gap-x-4 py-3',
        align === 'center' ? 'items-center gap-y-2' : 'items-baseline gap-y-1',
      )}
    >
      <dt className="flex flex-[0_0_170px] items-center gap-[calc(var(--space-1)*1.2)] text-sm text-neutral-700">
        {label}
      </dt>
      <dd
        className={cx('m-0 min-w-0', fill && 'flex flex-[1_1_240px] flex-wrap items-center gap-2')}
      >
        {children}
      </dd>
    </div>
  );
}
