import type { ReactNode } from 'react';
import { ExternalLink, touchLinkClass } from '@/components/ui/ExternalLink';
import { cx } from '@/lib/cx';
import { mailtoHref, whatsappHref } from '@/lib/links';
import type { Project } from '@/lib/projects';
import { DetailRow, DetailRows } from './DetailRows';

function Value({ text, href }: { text: string | null; href?: string | null }) {
  if (!text) return <span className="text-[17px]">—</span>;
  if (!href) return <span className="text-[17px]">{text}</span>;
  return href.startsWith('mailto:') ? (
    <a href={href} className={cx('text-[17px]', touchLinkClass)}>
      {text}
    </a>
  ) : (
    <ExternalLink href={href} className={cx('text-[17px]', touchLinkClass)}>
      {text}
    </ExternalLink>
  );
}

// Pestaña "Cliente" del export: un proyecto = un cliente (01 §3).
export function ClientTab({ project }: { project: Project }) {
  const rows: [string, ReactNode][] = [
    ['Cliente', <Value key="c" text={project.client} />],
    ['Contacto', <Value key="p" text={project.clientContact} />],
    ['Correo', <Value key="e" text={project.clientEmail} href={mailtoHref(project.clientEmail)} />],
    [
      'WhatsApp',
      <Value key="w" text={project.clientWhatsapp} href={whatsappHref(project.clientWhatsapp)} />,
    ],
    ['País', <Value key="pa" text={project.clientCountry} />],
  ];

  return (
    <DetailRows>
      {rows.map(([label, value]) => (
        <DetailRow key={label} label={label}>
          {value}
        </DetailRow>
      ))}
    </DetailRows>
  );
}
