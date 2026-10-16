// Datos de prueba hasta la tanda de auth (Supabase + Google). Se borra entonces.

export type ShellUser = { name: string; email: string; avatarUrl?: string };

export const MOCK_USER: ShellUser = { name: 'Yrvin Huamán', email: 'yrvin.dev@gmail.com' };

/** Proyectos no archivados (badge de "Proyectos" en la navegación). */
export const MOCK_ACTIVE_PROJECTS = 5;
