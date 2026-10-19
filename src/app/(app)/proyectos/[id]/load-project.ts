import 'server-only';
import { notFound, redirect } from 'next/navigation';
import { getProject } from '@/lib/data/projects';
import type { Project } from '@/lib/projects';

/**
 * El proyecto de la URL para la ficha y la edición: ajeno (RLS lo oculta pero existe)
 * → /403; inexistente → 404. Fuera de `page.tsx`: Next solo admite sus propios exports
 * en una página.
 */
export async function loadProject(id: string): Promise<Project> {
  const lookup = await getProject(id);
  if (lookup.status === 'forbidden') redirect('/403');
  if (lookup.status === 'not-found') notFound();
  return lookup.project;
}
