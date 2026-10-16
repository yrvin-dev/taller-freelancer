'use client';

import { useTheme } from '@/components/ThemeProvider';
import { ThemeSwitch } from '@/components/ui/ThemeSwitch';

/** ThemeSwitch conectado al tema global, para usarlo desde Server Components. */
export function ThemeToggle({ size }: { size?: 'sm' | 'md' }) {
  const { theme, toggle } = useTheme();
  return <ThemeSwitch theme={theme} onToggle={toggle} size={size} />;
}
