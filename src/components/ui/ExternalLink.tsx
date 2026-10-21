import type { AnchorHTMLAttributes, ReactNode } from 'react';

type ExternalLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'target' | 'rel'> & {
  href: string;
  children: ReactNode;
};

/**
 * Enlace suelto (no dentro de un párrafo) con objetivo táctil de 44px en mobile
 * (CLAUDE.md, regla 8). En desktop queda como texto.
 */
export const touchLinkClass = 'max-sm:inline-flex max-sm:min-h-[44px] max-sm:items-center';

/** Enlace a otro sitio: nueva pestaña sin `window.opener` y aviso para lectores. */
export function ExternalLink({ children, ...rest }: ExternalLinkProps) {
  return (
    <a target="_blank" rel="noopener noreferrer" {...rest}>
      {children}
      <span className="sr-only"> (se abre en otra pestaña)</span>
    </a>
  );
}
