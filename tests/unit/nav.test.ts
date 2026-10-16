import { parseSidebarExpanded, SIDEBAR_COOKIE, sidebarCookie } from '@/lib/layout-prefs';
import { navKeyFor } from '@/lib/nav';

describe('navKeyFor', () => {
  it.each([
    ['/', 'inicio'],
    ['/proyectos', 'proyectos'],
    ['/proyectos/agb', 'proyectos'],
    ['/proyectos/agb/editar', 'proyectos'],
    ['/calendario', 'calendario'],
    ['/cuenta', 'cuenta'],
    ['/proyectosx', null],
    ['/403', null],
  ] as const)('%s → %s', (pathname, expected) => {
    expect(navKeyFor(pathname)).toBe(expected);
  });
});

describe('sidebar cookie', () => {
  it('arranca colapsada: solo "1" la expande', () => {
    expect(parseSidebarExpanded('1')).toBe(true);
    expect(parseSidebarExpanded('0')).toBe(false);
    expect(parseSidebarExpanded(undefined)).toBe(false);
    expect(parseSidebarExpanded('true')).toBe(false);
  });

  it('serializa con un año de duración', () => {
    expect(sidebarCookie(true)).toBe(`${SIDEBAR_COOKIE}=1; Path=/; Max-Age=31536000; SameSite=Lax`);
  });
});
