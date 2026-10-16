import type { ReactNode } from 'react';
import { ThemeToggle } from './ThemeToggle';

export type PageHeaderProps = { title: string; description?: ReactNode; actions?: ReactNode };

/**
 * Encabezado de cada página del export: h1 con bajada a la izquierda y, a la derecha,
 * las acciones más el switch de tema (en mobile es el único switch visible).
 */
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-end gap-4">
      <div className="min-w-0 flex-[1_1_320px]">
        <h1 className="mb-1">{title}</h1>
        {description && <p className="m-0 text-neutral-700">{description}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {actions}
        <ThemeToggle />
      </div>
    </header>
  );
}
