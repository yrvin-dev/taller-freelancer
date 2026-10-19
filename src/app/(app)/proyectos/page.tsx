import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { ProjectRow } from '@/components/projects/ProjectRow';
import { ViewSwitch } from '@/components/projects/ViewSwitch';
import { buttonClass } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Table, Th } from '@/components/ui/Table';
import { listProjects } from '@/lib/data/projects';
import { parseProjectView } from '@/lib/projects';

export const metadata: Metadata = { title: 'Proyectos · Taller Freelancer' };

type ProjectsPageProps = { searchParams: Promise<{ vista?: string | string[] }> };

// Portada de "02 Proyectos". Los filtros (estado, stack, CMS) llegan en T19; los datos
// reales, con `listProjects(uid, filters)` en la tanda de datos.
export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const view = parseProjectView((await searchParams).vista);
  const projects = await listProjects();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Proyectos"
        description={`${projects.length} de ${projects.length} proyectos`}
        actions={
          <>
            <ViewSwitch value={view} />
            <Link href="/proyectos/nuevo" className={buttonClass()}>
              <Icon name="plus" />
              Nuevo proyecto
            </Link>
          </>
        }
      />

      {view === 'tarjetas' ? (
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6 p-0">
          {projects.map((project) => (
            <li key={project.id}>
              <ProjectCard project={project} />
            </li>
          ))}
        </ul>
      ) : (
        <Table caption="Proyectos">
          <thead>
            <tr>
              <Th>Proyecto</Th>
              <Th>Cliente</Th>
              <Th>Tipo</Th>
              <Th>Estado</Th>
              <Th>Stack</Th>
              <Th>CMS</Th>
              <Th>Entrega</Th>
              <Th>
                <span className="sr-only">Acciones</span>
              </Th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <ProjectRow key={project.id} project={project} />
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
