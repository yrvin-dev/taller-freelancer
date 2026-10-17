// Datos de prueba hasta la tanda de auth (Supabase + Google). Se borra entonces.

export type ShellUser = { name: string; email: string; avatarUrl?: string };

export const MOCK_USER: ShellUser = { name: 'Yrvin Huamán', email: 'yrvin.dev@gmail.com' };

/** Datos del perfil (tabla `profiles` del 03) hasta la tanda de auth. */
export const MOCK_PROFILE = {
  displayName: 'Yrvin',
  basePath: '',
  memberSince: '2026-03-01',
};
