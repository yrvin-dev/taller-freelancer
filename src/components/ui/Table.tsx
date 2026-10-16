import type { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react';
import { cx } from '@/lib/cx';

// Portado de `.table` (Broadsheet): 14px, encabezados de 11px en mayúsculas y filas
// con borde suave y hover. El encabezado usa --color-label (el 60% del export no
// llega a 4.5:1). Con scroll horizontal cuando no entra (mobile).

export function Table({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] border-collapse text-md">
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  );
}

export function Th({ className, children, ...rest }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="col"
      className={cx(
        'border-b border-divider p-2 text-left text-2xs font-normal uppercase tracking-caps text-label',
        className,
      )}
      {...rest}
    >
      {children}
    </th>
  );
}

export function Td({ className, children, ...rest }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cx('border-b border-table-row-border p-2 align-middle', className)} {...rest}>
      {children}
    </td>
  );
}

/** Fila del cuerpo con el hover del export. */
export function Tr({ children }: { children: ReactNode }) {
  return <tr className="hover:bg-table-row-hover">{children}</tr>;
}
