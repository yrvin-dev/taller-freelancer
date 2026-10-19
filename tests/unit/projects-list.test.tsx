import { fireEvent, render, screen, within } from '@testing-library/react';
import ProjectsPage from '@/app/(app)/proyectos/page';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { ViewSwitch } from '@/components/projects/ViewSwitch';
import { ThemeProvider } from '@/components/ThemeProvider';
import { mockProjects } from '../fixtures/projects';

vi.mock('@/lib/data/projects', () => import('../fixtures/data-projects'));

const nav = vi.hoisted(() => ({ replace: vi.fn(), search: '' }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: nav.replace }),
  usePathname: () => '/proyectos',
  useSearchParams: () => new URLSearchParams(nav.search),
}));

const TODAY = new Date(2026, 9, 5);
const byId = (id: string) => mockProjects(TODAY).find((p) => p.id === id)!;

async function renderPage(vista?: string) {
  const page = await ProjectsPage({ searchParams: Promise.resolve({ vista }) });
  return render(<ThemeProvider initialTheme="light">{page}</ThemeProvider>);
}

describe('ProjectCard', () => {
  it('es un enlace a la ficha nombrado por el proyecto', () => {
    render(<ProjectCard project={byId('agb')} />);
    const link = screen.getByRole('link', { name: 'Colegio Guillermo Brown' });
    expect(link).toHaveAttribute('href', '/proyectos/agb');
    expect(within(link).getByText('Institucional · Sanity')).toBeInTheDocument();
  });

  it('muestra hasta 4 chips de stack con el color de su paleta', () => {
    render(<ProjectCard project={byId('plv')} />);
    const chips = screen.getAllByRole('listitem');
    expect(chips.map((c) => c.textContent)).toEqual(['Next.js', 'Tailwind', 'Motion', 'Lenis']);
    expect(chips[0]).toHaveClass('tech-chip');
    expect(chips[0]).toHaveStyle({ '--chip': 'var(--chip-6)' });
  });

  it('sin CMS ni miniatura muestra "Sin CMS" y el recuadro neutro', () => {
    const { container } = render(<ProjectCard project={byId('dfl')} />);
    expect(screen.getByText('Dashboard · Sin CMS')).toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('Producción lleva el punto verde (--status-prod)', () => {
    render(<ProjectCard project={byId('agb')} />);
    const status = screen.getByText('Producción');
    expect(status.querySelector('[aria-hidden="true"]')).toHaveStyle({
      background: 'var(--status-prod)',
    });
  });
});

describe('/proyectos', () => {
  beforeEach(() => {
    nav.replace.mockClear();
    nav.search = '';
  });

  it('por defecto muestra tarjetas', async () => {
    await renderPage();
    expect(screen.getByRole('heading', { level: 1, name: 'Proyectos' })).toBeInTheDocument();
    expect(screen.getByText('6 de 6 proyectos')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Tarjetas' })).toBeChecked();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(6);
  });

  it('las dos vistas muestran los mismos proyectos', async () => {
    const { unmount } = await renderPage();
    const enTarjetas = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    unmount();

    await renderPage('tabla');
    const table = screen.getByRole('table', { name: 'Proyectos' });
    const enTabla = within(table)
      .getAllByRole('link', { name: /^Abrir / })
      .map((a) => a.textContent?.replace(/^Abrir\s*/, ''));
    expect(enTabla).toEqual(enTarjetas);
    expect(screen.getByRole('radio', { name: 'Tabla' })).toBeChecked();
  });

  it('en la tabla, cada "Abrir" se distingue por el nombre y Producción lleva el punto verde', async () => {
    await renderPage('tabla');
    expect(screen.getByRole('link', { name: 'Abrir Colegio Guillermo Brown' })).toHaveAttribute(
      'href',
      '/proyectos/agb',
    );
    const row = screen.getByRole('link', { name: 'Abrir Colegio Guillermo Brown' }).closest('tr')!;
    expect(within(row).getByText('Producción').querySelector('[aria-hidden="true"]')).toHaveStyle({
      background: 'var(--status-prod)',
    });
  });
});

describe('ViewSwitch', () => {
  beforeEach(() => nav.replace.mockClear());

  it('escribe ?vista=tabla y conserva otros parámetros', () => {
    nav.search = 'q=polera';
    render(<ViewSwitch value="tarjetas" />);
    fireEvent.click(screen.getByRole('radio', { name: 'Tabla' }));
    expect(nav.replace).toHaveBeenCalledWith('/proyectos?q=polera&vista=tabla', { scroll: false });
  });

  it('volver a tarjetas quita el parámetro', () => {
    nav.search = 'vista=tabla';
    render(<ViewSwitch value="tabla" />);
    fireEvent.click(screen.getByRole('radio', { name: 'Tarjetas' }));
    expect(nav.replace).toHaveBeenCalledWith('/proyectos', { scroll: false });
  });
});
