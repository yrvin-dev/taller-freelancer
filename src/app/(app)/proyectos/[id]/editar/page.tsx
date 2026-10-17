import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProjectForm } from '@/components/projects/ProjectForm';
import { todayIn } from '@/lib/format';
import { mockProjects } from '@/lib/mock/projects';
import { toFormValues } from '@/lib/project-form';

type Params = Promise<{ id: string }>;

// Datos de prueba hasta la tanda de datos (entonces `getProject(uid, id)`).
const findProject = (id: string) => mockProjects(todayIn()).find((p) => p.id === id);

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const project = findProject((await params).id);
  return { title: `Editar · ${project?.name ?? 'Proyecto'} · Taller Freelancer` };
}

export default async function EditProjectPage({ params }: { params: Params }) {
  const project = findProject((await params).id);
  if (!project) notFound();

  return (
    <ProjectForm
      mode="edit"
      projectId={project.id}
      title={`Editar · ${project.name}`}
      initial={toFormValues(project)}
      thumbnailUrl={project.thumbnailUrl}
      cancelHref={`/proyectos/${project.id}`}
    />
  );
}
