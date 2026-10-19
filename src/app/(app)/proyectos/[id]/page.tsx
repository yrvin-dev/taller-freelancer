import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AccessTab } from '@/components/projects/detail/AccessTab';
import { ClientTab } from '@/components/projects/detail/ClientTab';
import { NoteLog } from '@/components/projects/detail/NoteLog';
import { PaymentsTab } from '@/components/projects/detail/PaymentsTab';
import { ProjectHeader } from '@/components/projects/detail/ProjectHeader';
import { ProjectTabs } from '@/components/projects/detail/ProjectTabs';
import { StackTab } from '@/components/projects/detail/StackTab';
import { SummaryTab } from '@/components/projects/detail/SummaryTab';
import { todayIn } from '@/lib/format';
import { getProject } from '@/lib/data/projects';
import { loadProject } from './load-project';
import { parseProjectTab, type Project, type ProjectTab } from '@/lib/projects';

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ tab?: string | string[] }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const lookup = await getProject((await params).id);
  const name = lookup.status === 'ok' ? lookup.project.name : 'Proyecto';
  return { title: `${name} · Taller Freelancer` };
}

type PanelProps = { project: Project; today: Date };

const PANELS: Record<ProjectTab, (props: PanelProps) => ReactNode> = {
  resumen: SummaryTab,
  cliente: ClientTab,
  stack: StackTab,
  accesos: AccessTab,
  pagos: PaymentsTab,
  notas: ({ project }) => (
    // key: al cambiar de proyecto, la bitácora arranca de nuevo con sus notas.
    <NoteLog key={project.id} projectId={project.id} initialNotes={project.notes} />
  ),
};

// Portada de "03 Ficha del proyecto".
export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const today = todayIn();
  const project = await loadProject((await params).id);

  const tab = parseProjectTab((await searchParams).tab);
  const Panel = PANELS[tab];

  return (
    <section className="flex flex-col gap-6" aria-labelledby="ficha-titulo">
      <ProjectHeader project={project} />
      <ProjectTabs projectId={project.id} active={tab} />
      <div>
        <Panel project={project} today={today} />
      </div>
    </section>
  );
}
