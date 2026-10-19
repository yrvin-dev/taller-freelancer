import 'server-only';
import { cache } from 'react';
import type { Project } from '@/lib/projects';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PROJECT_SELECT, toProject } from './project-mapper';

// Lecturas de proyectos (03 §6). Todas con la sesión del usuario: RLS devuelve solo
// lo suyo. Si una query falla, se lanza (lo atrapa `error.tsx`): nunca se muestra
// "no tienes proyectos" por un error de red.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Proyectos del usuario, el más reciente primero. */
export const listProjects = cache(async (): Promise<Project[]> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('projects')
    .select(PROJECT_SELECT)
    .order('updated_at', { ascending: false });
  if (error) throw new Error(`No se pudieron leer los proyectos: ${error.code}`);
  return data.map(toProject);
});

export type ProjectLookup =
  { status: 'ok'; project: Project } | { status: 'forbidden' } | { status: 'not-found' };

/**
 * Un proyecto por id. Si RLS no lo devuelve, `project_exists` (solo un booleano)
 * distingue "no es tuyo" (403) de "no existe" (404).
 */
export const getProject = cache(async (id: string): Promise<ProjectLookup> => {
  if (!UUID.test(id)) return { status: 'not-found' };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('projects')
    .select(PROJECT_SELECT)
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`No se pudo leer el proyecto: ${error.code}`);
  if (data) return { status: 'ok', project: toProject(data) };

  const { data: exists } = await supabase.rpc('project_exists', { p_id: id });
  return exists ? { status: 'forbidden' } : { status: 'not-found' };
});
