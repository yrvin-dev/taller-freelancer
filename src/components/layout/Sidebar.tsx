'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef, useState } from 'react';
import { useTheme } from '@/components/ThemeProvider';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { Tag } from '@/components/ui/Tag';
import { ThemeSwitchGraphic } from '@/components/ui/ThemeSwitch';
import { cx } from '@/lib/cx';
import { sidebarCookie } from '@/lib/layout-prefs';
import type { ShellUser } from '@/lib/profile';
import { NAV_ITEMS, navKeyFor } from '@/lib/nav';

export type SidebarProps = {
  user: ShellUser;
  /** Proyectos no archivados: badge de "Proyectos". */
  activeCount: number;
  /** Viene de la cookie `tf-side` leída en el servidor. */
  initialExpanded: boolean;
};

/**
 * Sidebar de desktop (≥ 820px), portada del export: 76px colapsada y 240px expandida.
 * La coreografía (ancho, etiquetas que aparecen con retraso, chevron ↔ hamburguesa)
 * vive en globals.css bajo `.sidebar*`, guiada por `data-expanded`.
 */
export function Sidebar({ user, activeCount, initialExpanded }: SidebarProps) {
  const [expanded, setExpanded] = useState(initialExpanded);
  const active = navKeyFor(usePathname());
  const { theme, toggle } = useTheme();
  const searchRef = useRef<HTMLInputElement>(null);
  const dark = theme === 'dark';

  function persist(next: boolean) {
    setExpanded(next);
    document.cookie = sidebarCookie(next);
  }

  // Colapsada, la lupa expande la sidebar y enfoca el campo (como `openSearch` del export).
  function openSearch() {
    persist(true);
    setTimeout(() => searchRef.current?.focus(), 60);
  }

  return (
    <aside
      data-expanded={expanded}
      className="sidebar sticky top-0 hidden h-screen flex-none flex-col gap-4 overflow-hidden rounded-r-xl bg-surface px-[calc(var(--space-2)*1.4)] py-4 font-ui shadow-sidebar shell:flex"
    >
      <div className="relative flex min-h-[44px] w-[212px] items-center">
        <div className="sidebar-label flex items-center gap-2 whitespace-nowrap pl-[4px]">
          <Icon name="brand" className="text-[26px] text-accent" />
          <span className="flex flex-col leading-none">
            <span className="text-xl font-extrabold">Taller</span>
            <span className="mt-[2px] text-[10px] font-bold tracking-[0.22em] text-accent-700">
              FREELANCER
            </span>
          </span>
        </div>
        <button
          type="button"
          onClick={() => persist(!expanded)}
          aria-expanded={expanded}
          aria-label={expanded ? 'Esconder menú' : 'Mostrar menú'}
          title={expanded ? 'Esconder menú' : 'Mostrar menú'}
          className="sidebar-toggle absolute top-0 grid h-[44px] w-[48px] cursor-pointer place-items-center rounded-pill border-0 bg-transparent text-text hover:bg-state-hover"
        >
          <Icon name="collapse" className="sidebar-chevron text-[22px]" />
          <Icon name="menu" className="sidebar-burger text-[22px]" />
        </button>
      </div>

      <form
        action="/proyectos"
        role="search"
        className="relative flex h-[48px] w-[212px] flex-none items-center"
      >
        <button
          type={expanded ? 'submit' : 'button'}
          onClick={expanded ? undefined : openSearch}
          aria-label="Buscar"
          title="Buscar"
          className="absolute left-0 z-10 grid h-[48px] w-[48px] cursor-pointer place-items-center rounded-full border-0 bg-avatar text-on-ink shadow-search hover:brightness-[1.08]"
        >
          <Icon name="search" className="text-[20px]" />
        </button>
        <input
          ref={searchRef}
          name="q"
          type="search"
          placeholder="Buscar…"
          aria-label="Buscar proyectos"
          tabIndex={expanded ? 0 : -1}
          className="sidebar-label h-[48px] w-full rounded-pill border border-divider bg-surface pl-[58px] pr-2 text-md text-text caret-accent placeholder:text-placeholder hover:border-state-border-hover focus-visible:border-accent focus-visible:outline-offset-0"
        />
      </form>

      <nav aria-label="Principal" className="mt-2 flex flex-col gap-[calc(var(--space-1)*1.2)]">
        {NAV_ITEMS.map((item) => {
          const isActive = item.key === active;
          return (
            <Link
              key={item.key}
              href={item.href}
              title={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={cx(
                'sidebar-row flex h-[48px] items-center gap-3 overflow-hidden whitespace-nowrap rounded-pill px-[13px] text-base no-underline',
                isActive
                  ? 'bg-state-accent-active font-semibold text-accent-700 hover:text-accent-700'
                  : 'text-text hover:bg-state-accent-hover hover:text-accent-700',
              )}
            >
              <Icon name={item.icon} solid={isActive} className="flex-none text-[22px]" />
              <span className="sidebar-label flex-1">{item.label}</span>
              {/* Espacio para el nombre accesible ("Proyectos 5 activos"); en flex no se ve. */}{' '}
              {item.key === 'proyectos' && (
                <Tag tone="accent" className="sidebar-label">
                  {activeCount} <span className="sr-only">activos</span>
                </Tag>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Colapsada, el bloque se pliega y queda inerte (sin foco ni clics). */}
      <div
        inert={!expanded}
        className="sidebar-user sidebar-label mt-auto flex w-[212px] items-center gap-2 overflow-hidden whitespace-nowrap rounded-lg bg-state-subtle py-[calc(var(--space-1)*1.2)] pl-[calc(var(--space-1)*1.2)] pr-1"
      >
        <Avatar name={user.name} src={user.avatarUrl} />
        <span className="flex min-w-0 flex-1 flex-col leading-control">
          <span className="truncate text-md font-bold">{user.name}</span>
          <span className="truncate text-2xs text-neutral-700">{user.email}</span>
        </span>
        {/* La ruta /auth/signout se crea en la tanda de auth. */}
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="grid h-[34px] w-[34px] cursor-pointer place-items-center rounded-full border-0 bg-transparent text-neutral-700 hover:bg-state-danger-hover hover:text-accent-2-700"
          >
            <Icon name="logout" className="text-[16px]" />
          </button>
        </form>
      </div>

      {/* El nombre del botón es el texto visible ("Modo oscuro" / "Modo claro"): la acción. */}
      <button
        type="button"
        onClick={toggle}
        title="Cambiar tema"
        className="sidebar-row flex h-[48px] flex-none cursor-pointer items-center gap-3 overflow-hidden whitespace-nowrap rounded-pill border-0 bg-transparent px-[5px] text-base text-neutral-700 hover:bg-state-hover hover:text-text"
      >
        <ThemeSwitchGraphic dark={dark} size="sm" />
        <span className="sidebar-label">{dark ? 'Modo claro' : 'Modo oscuro'}</span>
      </button>
    </aside>
  );
}
