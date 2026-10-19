import type { Metadata } from 'next';
import { ProjectForm } from '@/components/projects/ProjectForm';
import { loadProject } from '../load-project';
import { getProject } from '@/lib/data/projects';
import { toFormValues } from '@/lib/project-form';

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const lookup = await getProject((await params).id);
  const name = lookup.status === 'ok' ? lookup.project.name : 'Proyecto';
  return { title: `Editar · ${name} · Taller Freelancer` };
}

export default async function EditProjectPage({ params }: { params: Params }) {
  const project = await loadProject((await params).id);

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
