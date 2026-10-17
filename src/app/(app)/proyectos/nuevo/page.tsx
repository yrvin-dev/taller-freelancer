import type { Metadata } from 'next';
import { ProjectForm } from '@/components/projects/ProjectForm';
import { EMPTY_PROJECT_FORM } from '@/lib/project-form';

export const metadata: Metadata = { title: 'Nuevo proyecto · Taller Freelancer' };

export default function NewProjectPage() {
  return (
    <ProjectForm
      mode="new"
      projectId={null}
      title="Nuevo proyecto"
      initial={EMPTY_PROJECT_FORM}
      thumbnailUrl={null}
      cancelHref="/proyectos"
    />
  );
}
