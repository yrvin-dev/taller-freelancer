import type { IconName } from './icons';

// Navegación principal (sidebar en desktop, barra inferior en mobile), en el orden del export.
export const NAV_ITEMS = [
  { key: 'inicio', label: 'Inicio', href: '/', icon: 'home' },
  { key: 'proyectos', label: 'Proyectos', href: '/proyectos', icon: 'folder' },
  { key: 'calendario', label: 'Calendario', href: '/calendario', icon: 'calendar' },
  { key: 'cuenta', label: 'Cuenta', href: '/cuenta', icon: 'user' },
] as const satisfies ReadonlyArray<{ key: string; label: string; href: string; icon: IconName }>;

export type NavKey = (typeof NAV_ITEMS)[number]['key'];

/** Ítem activo para una ruta: `/proyectos/agb/editar` → `proyectos`. */
export function navKeyFor(pathname: string): NavKey | null {
  if (pathname === '/') return 'inicio';
  const item = NAV_ITEMS.find(
    ({ href }) => href !== '/' && (pathname === href || pathname.startsWith(`${href}/`)),
  );
  return item?.key ?? null;
}
