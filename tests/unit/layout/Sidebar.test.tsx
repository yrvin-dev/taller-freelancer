import { fireEvent, render, screen } from '@testing-library/react';
import { Sidebar } from '@/components/layout/Sidebar';
import { ThemeProvider } from '@/components/ThemeProvider';
import { SIDEBAR_COOKIE } from '@/lib/layout-prefs';

const pathname = vi.hoisted(() => ({ current: '/' }));
vi.mock('next/navigation', () => ({ usePathname: () => pathname.current }));

function renderSidebar(expanded = false) {
  return render(
    <ThemeProvider initialTheme="light">
      <Sidebar
        user={{ name: 'Yrvin Huamán', email: 'yrvin.dev@gmail.com' }}
        activeCount={5}
        initialExpanded={expanded}
      />
    </ThemeProvider>,
  );
}

describe('Sidebar', () => {
  beforeEach(() => {
    pathname.current = '/';
    document.cookie = `${SIDEBAR_COOKIE}=; Max-Age=0; Path=/`;
  });

  it('marca el ítem activo con aria-current, también en subrutas', () => {
    pathname.current = '/proyectos/agb/editar';
    renderSidebar();
    const nav = screen.getByRole('navigation', { name: 'Principal' });
    const active = screen.getByRole('link', { name: /Proyectos/ });
    expect(nav).toContainElement(active);
    expect(active).toHaveAttribute('aria-current', 'page');
    expect(active.querySelector('i')).toHaveClass('fi-sr-folder');
    expect(screen.getByRole('link', { name: 'Inicio' })).not.toHaveAttribute('aria-current');
  });

  it('el badge de proyectos se lee con contexto', () => {
    renderSidebar(true);
    expect(screen.getByRole('link', { name: 'Proyectos 5 activos' })).toHaveAttribute(
      'href',
      '/proyectos',
    );
  });

  it('colapsar y expandir cambia data-expanded, aria-expanded y la cookie', () => {
    const { container } = renderSidebar(false);
    const aside = container.querySelector('aside');
    const toggle = screen.getByRole('button', { name: 'Mostrar menú' });
    expect(aside).toHaveAttribute('data-expanded', 'false');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(toggle);
    expect(aside).toHaveAttribute('data-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Esconder menú' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(document.cookie).toContain(`${SIDEBAR_COOKIE}=1`);
  });

  it('colapsada: el bloque de usuario queda inerte y la lupa expande sin enviar', () => {
    const { container } = renderSidebar(false);
    expect(container.querySelector('.sidebar-user')).toHaveAttribute('inert');
    expect(screen.getByRole('searchbox', { name: 'Buscar proyectos' })).toHaveAttribute(
      'tabindex',
      '-1',
    );

    const search = screen.getByRole('button', { name: 'Buscar' });
    expect(search).toHaveAttribute('type', 'button');
    fireEvent.click(search);
    expect(container.querySelector('aside')).toHaveAttribute('data-expanded', 'true');
    expect(search).toHaveAttribute('type', 'submit');
  });

  it('la búsqueda es un formulario GET a /proyectos con el parámetro q', () => {
    renderSidebar(true);
    const form = screen.getByRole('search');
    expect(form).toHaveAttribute('action', '/proyectos');
    expect(screen.getByRole('searchbox')).toHaveAttribute('name', 'q');
  });

  it('el botón de tema muestra la acción y cambia el tema', () => {
    document.documentElement.dataset.theme = 'light';
    renderSidebar(true);
    fireEvent.click(screen.getByRole('button', { name: 'Modo oscuro' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(screen.getByRole('button', { name: 'Modo claro' })).toBeInTheDocument();
  });
});
