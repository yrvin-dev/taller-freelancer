import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ClientTab } from '@/components/projects/detail/ClientTab';
import { ProjectHeader } from '@/components/projects/detail/ProjectHeader';
import { ProjectTabs } from '@/components/projects/detail/ProjectTabs';
import { StackTab } from '@/components/projects/detail/StackTab';
import { SummaryTab } from '@/components/projects/detail/SummaryTab';
import { todayIn } from '@/lib/format';
import { mockProjects } from '@/lib/mock/projects';
import { parseProjectTab, type Project, type ProjectTab } from '@/lib/projects';

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ tab?: string | string[] }>;

// Datos de prueba hasta la tanda de datos: entonces `getProject(uid, id)`; un
// proyecto ajeno dará 403 por RLS.
function findProject(id: string): Project | undefined {
  return mockProjects(todayIn()).find((project) => project.id === id);
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const project = findProject((await params).id);
  return { title: `${project?.name ?? 'Proyecto'} · Taller Freelancer` };
}

const PANELS: Record<ProjectTab, (props: { project: Project }) => React.ReactNode> = {
  resumen: SummaryTab,
  cliente: ClientTab,
  stack: StackTab,
};

// Portada de "03 Ficha del proyecto".
export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const project = findProject((await params).id);
  if (!project) notFound();

  const tab = parseProjectTab((await searchParams).tab);
  const Panel = PANELS[tab];

  return (
    <section className="flex flex-col gap-6" aria-labelledby="ficha-titulo">
      <ProjectHeader project={project} />
      <ProjectTabs projectId={project.id} active={tab} />
      <div>
        <Panel project={project} />
      </div>
    </section>
  );
}
