'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { themeCookie, type Theme } from '@/lib/theme';

type ThemeApi = { theme: Theme; setTheme(theme: Theme): void; toggle(): void };

const ThemeContext = createContext<ThemeApi | null>(null);

/**
 * Estado del tema en el cliente. El valor inicial viene de la cookie leída en el
 * servidor (layout raíz), así que el primer render ya coincide con <html data-theme>.
 */
export function ThemeProvider({
  initialTheme,
  children,
}: {
  initialTheme: Theme;
  children: ReactNode;
}) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    document.documentElement.dataset.theme = next;
    document.cookie = themeCookie(next);
  }, []);

  const toggle = useCallback(() => {
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  }, [setTheme]);

  const api = useMemo(() => ({ theme, setTheme, toggle }), [theme, setTheme, toggle]);
  return <ThemeContext.Provider value={api}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeApi {
  const api = useContext(ThemeContext);
  if (!api) throw new Error('useTheme debe usarse dentro de <ThemeProvider>.');
  return api;
}
