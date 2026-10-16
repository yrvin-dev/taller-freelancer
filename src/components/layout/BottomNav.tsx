'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { cx } from '@/lib/cx';
import { NAV_ITEMS, navKeyFor } from '@/lib/nav';

/**
 * Navegación de mobile (< 820px), portada del export: barra fija abajo con los 4
 * destinos. Respeta el área segura del iPhone (`safe-area-inset-bottom`).
 */
export function BottomNav() {
  const active = navKeyFor(usePathname());

  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 bg-surface px-1 pb-[calc(var(--space-1)*1.2+env(safe-area-inset-bottom))] pt-[calc(var(--space-1)*1.2)] font-ui shadow-md shell:hidden"
    >
      {NAV_ITEMS.map((item) => {
        const isActive = item.key === active;
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={cx(
              'flex min-h-[52px] flex-col items-center justify-center gap-[2px] text-xs no-underline',
              isActive
                ? 'font-semibold text-accent-700 hover:text-accent-700'
                : 'text-text hover:text-text',
            )}
          >
            <Icon name={item.icon} solid={isActive} className="text-[22px]" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
