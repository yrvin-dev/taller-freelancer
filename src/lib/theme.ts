// Tema claro/oscuro. Se guarda en una cookie para que el servidor renderice
// <html data-theme> con el tema correcto y no haya parpadeo al cargar.

export const THEMES = ['light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

export const DEFAULT_THEME: Theme = 'light';
export const THEME_COOKIE = 'tf-theme';
const ONE_YEAR_S = 60 * 60 * 24 * 365;

/** Valor de la cookie → tema. Cualquier valor desconocido o ausente es `light`. */
export function parseTheme(value: string | undefined | null): Theme {
  return THEMES.find((theme) => theme === value) ?? DEFAULT_THEME;
}

/** Cadena para `document.cookie`. No es sensible: no necesita HttpOnly. */
export function themeCookie(theme: Theme): string {
  return `${THEME_COOKIE}=${theme}; Path=/; Max-Age=${ONE_YEAR_S}; SameSite=Lax`;
}
