// Preferencia de la sidebar (expandida o colapsada). Igual que el tema, vive en una
// cookie para que el servidor renderice el ancho correcto y no haya salto al cargar.

export const SIDEBAR_COOKIE = 'tf-side';
const ONE_YEAR_S = 60 * 60 * 24 * 365;

/** Como en el export, la sidebar arranca colapsada: solo `'1'` la expande. */
export function parseSidebarExpanded(value: string | undefined | null): boolean {
  return value === '1';
}

export function sidebarCookie(expanded: boolean): string {
  return `${SIDEBAR_COOKIE}=${expanded ? '1' : '0'}; Path=/; Max-Age=${ONE_YEAR_S}; SameSite=Lax`;
}
