import type { ReactNode } from 'react';
import { cx } from '@/lib/cx';

// Filas "etiqueta · valor" de las pestañas Cliente, Stack y Accesos del export:
// etiqueta de 170px en 13px y el valor al lado; en mobile se apilan.

export function DetailRows({ children }: { children: ReactNode }) {
  return <dl className="m-0 flex max-w-[720px] flex-col">{children}</dl>;
}

export function DetailRow({
  label,
  children,
  align = 'baseline',
}: {
  label: ReactNode;
  children: ReactNode;
  align?: 'baseline' | 'center';
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
      <dd className="m-0 min-w-0">{children}</dd>
    </div>
  );
}
