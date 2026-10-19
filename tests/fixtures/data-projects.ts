// Doble de `src/lib/data/projects.ts` para tests de páginas:
// `vi.mock('@/lib/data/projects', () => import('../fixtures/data-projects'))`.
// "ajeno" simula un proyecto que RLS oculta pero existe (403).

import { todayIn } from '@/lib/format';
import type { ProjectLookup } from '@/lib/data/projects';
import { mockProjects } from './projects';

export async function listProjects() {
  return mockProjects(todayIn());
}

export async function getProject(id: string): Promise<ProjectLookup> {
  if (id === 'ajeno') return { status: 'forbidden' };
  const project = mockProjects(todayIn()).find((p) => p.id === id);
  return project ? { status: 'ok', project } : { status: 'not-found' };
}
