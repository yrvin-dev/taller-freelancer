import { fireEvent, render, screen } from '@testing-library/react';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { PageHeader } from '@/components/layout/PageHeader';
import { ThemeProvider } from '@/components/ThemeProvider';

const pathname = vi.hoisted(() => ({ current: '/' }));
vi.mock('next/navigation', () => ({ usePathname: () => pathname.current }));

describe('BottomNav', () => {
  it('muestra los 4 destinos y marca el activo', () => {
    pathname.current = '/calendario';
    render(<BottomNav />);
    const nav = screen.getByRole('navigation', { name: 'Principal' });
    const links = screen.getAllByRole('link');
    expect(links.map((l) => l.textContent)).toEqual([
      'Inicio',
      'Proyectos',
      'Calendario',
      'Cuenta',
    ]);
    const active = screen.getByRole('link', { name: 'Calendario' });
    expect(nav).toContainElement(active);
    expect(active).toHaveAttribute('aria-current', 'page');
    expect(active.querySelector('i')).toHaveClass('fi-sr-calendar');
  });

  it('solo existe debajo de 820px y respeta el área segura', () => {
    render(<BottomNav />);
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('fixed', 'shell:hidden');
    expect(nav.className).toContain('env(safe-area-inset-bottom)');
  });
});

describe('AppHeader', () => {
  it('muestra la marca con nombre accesible y se oculta en desktop', () => {
    const { container } = render(<AppHeader />);
    expect(screen.getByRole('img', { name: 'Taller Freelancer' })).toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass('shell:hidden');
  });
});

describe('PageHeader', () => {
  it('muestra título, bajada, acciones y el switch de tema conectado', () => {
    document.documentElement.dataset.theme = 'light';
    render(
      <ThemeProvider initialTheme="light">
        <PageHeader
          title="Proyectos"
          description="12 proyectos · 3 en desarrollo"
          actions={<button type="button">Nuevo proyecto</button>}
        />
      </ThemeProvider>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Proyectos' })).toBeInTheDocument();
    expect(screen.getByText('12 proyectos · 3 en desarrollo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Nuevo proyecto' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('switch', { name: 'Modo oscuro' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
  });
});
