import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { HomeEmptyState } from '@/components/projects/HomeEmptyState';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { ProjectFilters } from '@/components/projects/ProjectFilters';
import { ProjectRow } from '@/components/projects/ProjectRow';
import { ViewSwitch } from '@/components/projects/ViewSwitch';
import { buttonClass } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Table, Th } from '@/components/ui/Table';
import { listProjects } from '@/lib/data/projects';
import {
  filterProjects,
  filtersQuery,
  NO_FILTERS,
  parseProjectFilters,
} from '@/lib/project-filters';
import { parseProjectView } from '@/lib/projects';

export const metadata: Metadata = { title: 'Proyectos · Taller Freelancer' };

type ProjectsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// Portada de "02 Proyectos". La búsqueda, los filtros y la vista viven en la URL; el
// filtrado corre aquí, en el servidor, sobre la lista del usuario (03 §6).
export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const params = await searchParams;
  const view = parseProjectView(params.vista);
  const filters = parseProjectFilters(params);
  const projects = await listProjects();
  const { filtered, counts, stackOptions, cmsOptions } = filterProjects(projects, filters);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Proyectos"
        description={`${filtered.length} de ${projects.length} proyectos`}
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

      {projects.length === 0 ? (
        // Sin proyectos no hay nada que filtrar: el mismo vacío de la home.
        <HomeEmptyState />
      ) : (
        <ProjectFilters
          value={filters}
          view={view}
          counts={counts}
          stackOptions={stackOptions}
          cmsOptions={cmsOptions}
        />
      )}

      {projects.length === 0 ? null : filtered.length === 0 ? (
        <section className="flex flex-col items-start gap-2 py-8">
          <h2 className="m-0 text-2xl">Ningún proyecto coincide</h2>
          <p className="m-0 text-neutral-700">Prueba con otro término o quita algún filtro.</p>
          <Link
            href={`/proyectos${filtersQuery(NO_FILTERS, view)}`}
            className={buttonClass({ variant: 'secondary' })}
          >
            Limpiar filtros
          </Link>
        </section>
      ) : view === 'tarjetas' ? (
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6 p-0">
          {filtered.map((project) => (
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
            {filtered.map((project) => (
              <ProjectRow key={project.id} project={project} />
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
