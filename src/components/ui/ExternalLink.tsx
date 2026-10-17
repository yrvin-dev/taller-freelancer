import type { AnchorHTMLAttributes, ReactNode } from 'react';

type ExternalLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'target' | 'rel'> & {
  href: string;
  children: ReactNode;
};

/** Enlace a otro sitio: nueva pestaña sin `window.opener` y aviso para lectores. */
export function ExternalLink({ children, ...rest }: ExternalLinkProps) {
  return (
    <a target="_blank" rel="noopener noreferrer" {...rest}>
      {children}
      <span className="sr-only"> (se abre en otra pestaña)</span>
    </a>
  );
}
