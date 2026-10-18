import type { ReactNode } from 'react';
import { Icon } from '@/components/ui/Icon';
import type { IconName } from '@/lib/icons';

export type ErrorScreenProps = {
  /** "ERROR 403"; sin código, solo "ERROR". */
  code?: number;
  icon: IconName;
  title: string;
  children: ReactNode;
  actions: ReactNode;
};

// Portada de "07 Sin acceso (403)" y reusada para 404 y errores (02 §8.6).
export function ErrorScreen({ code, icon, title, children, actions }: ErrorScreenProps) {
  return (
    <section
      aria-labelledby="error-titulo"
      className="flex max-w-[520px] flex-1 flex-col items-start justify-center gap-4 py-8"
    >
      <span className="grid h-[64px] w-[64px] place-items-center rounded-full bg-accent-soft text-accent">
        <Icon name={icon} className="text-[26px]" />
      </span>
      <span className="text-sm font-bold tracking-caps text-neutral-700">
        {code ? `ERROR ${code}` : 'ERROR'}
      </span>
      <h1 id="error-titulo" className="m-0">
        {title}
      </h1>
      <p className="m-0 text-neutral-700">{children}</p>
      <div className="mt-2 flex flex-wrap gap-2">{actions}</div>
    </section>
  );
}
