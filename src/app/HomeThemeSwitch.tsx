'use client';

import { useTheme } from '@/components/ThemeProvider';
import { ThemeSwitch } from '@/components/ui/ThemeSwitch';

/** Provisional hasta T07: el switch vivirá en el header y la sidebar. */
export function HomeThemeSwitch() {
  const { theme, toggle } = useTheme();
  return <ThemeSwitch theme={theme} onToggle={toggle} />;
}
