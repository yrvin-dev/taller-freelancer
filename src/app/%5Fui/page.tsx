import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusDot } from '@/components/ui/StatusDot';
import { Tag } from '@/components/ui/Tag';
import { PROJECT_STATUSES } from '@/lib/domain';
import { Interactive } from './Interactive';

// Galería de componentes para comparar con el export (light y dark lado a lado).
// La carpeta es `%5Fui` por la misma razón que `%5Ftokens`. Solo existe en desarrollo.
export const metadata: Metadata = { title: 'UI · Taller Freelancer', robots: 'noindex' };

function Row({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h6>{title}</h6>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

function Panel({ theme }: { theme: 'light' | 'dark' }) {
  return (
    <section data-theme={theme} className="flex flex-col gap-6 bg-bg p-page text-text">
      <h3>{theme === 'light' ? 'Light' : 'Dark'}</h3>

      <Row title="Button · md">
        <Button icon="plus">Nuevo proyecto</Button>
        <Button variant="secondary" icon="edit">
          Editar
        </Button>
        <Button variant="ghost" icon="external">
          Abrir
        </Button>
        <Button iconOnly icon="copy" aria-label="Copiar" variant="secondary" />
        <Button disabled>Deshabilitado</Button>
        <Button loading>Entrando…</Button>
      </Row>

      <Row title="Button · sm y destructivo">
        <Button size="sm">Guardar</Button>
        <Button size="sm" variant="secondary">
          Cancelar
        </Button>
        <Button size="sm" tone="danger">
          Sí, borrar
        </Button>
        <Button variant="ghost" tone="danger" icon="trash">
          Borrar cuenta
        </Button>
        <Button iconOnly icon="trash" aria-label="Borrar entrada" variant="ghost" tone="danger" />
      </Row>

      <Row title="Tag">
        <Tag tone="accent">accent</Tag>
        <Tag tone="accent-2">Vencido</Tag>
        <Tag>neutral</Tag>
        <Tag tone="outline">outline</Tag>
      </Row>

      <Row title="StatusDot">
        {PROJECT_STATUSES.map((status) => (
          <StatusDot key={status} status={status} />
        ))}
      </Row>

      <Row title="Avatar">
        <Avatar name="Yrvin Huamán" />
        <Avatar name="Camila Torres" size={40} />
        <Avatar name="Yrvin Huamán" size={64} />
      </Row>

      <Row title="Field · Input · Select · Textarea · Seg">
        <div className="w-full">
          <Interactive id={theme} />
        </div>
      </Row>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card featured>
          <h5>Entregas próximas</h5>
          <p>Card destacada (una por pantalla).</p>
        </Card>
        <Card as="article">
          <h5>Card</h5>
          <p>Superficie plana, sombra sm.</p>
        </Card>
        <Card as="a" href="/_ui">
          <h5>Card enlace</h5>
          <p>Hover: sombra md y 1px arriba.</p>
        </Card>
      </div>
    </section>
  );
}

export default function UiPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return (
    <main className="grid lg:grid-cols-2">
      <Panel theme="light" />
      <Panel theme="dark" />
    </main>
  );
}
