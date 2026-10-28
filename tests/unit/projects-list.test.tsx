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

async function renderPage(params: Record<string, string> = {}) {
  const page = await ProjectsPage({ searchParams: Promise.resolve(params) });
  return render(<ThemeProvider initialTheme="light">{page}</ThemeProvider>);
}

describe('ProjectCard', () => {
  it('el nombre es el enlace a la ficha y cubre la parte tintada (nombre = texto visible)', () => {
    render(<ProjectCard project={byId('agb')} />);
    const link = screen.getByRole('link', { name: 'Colegio Guillermo Brown' });
    expect(link).toHaveAttribute('href', '/proyectos/agb');
    expect(link).toHaveTextContent(/^Colegio Guillermo Brown$/); // WCAG 2.5.3
    expect(link).toHaveClass('after:absolute', 'after:inset-0');
    const foot = screen.getByText('Institucional · Sanity').closest('div');
    expect(foot).toHaveClass('relative');
    expect(foot).toContainElement(link);
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
    expect(status.querySelector('[aria-hidden="true"]')).toHaveAttribute(
      'style',
      'background: var(--status-prod);',
    );
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

    await renderPage({ vista: 'tabla' });
    const table = screen.getByRole('table', { name: 'Proyectos' });
    const enTabla = within(table)
      .getAllByRole('link', { name: /^Abrir / })
      .map((a) => a.textContent?.replace(/^Abrir\s*/, ''));
    expect(enTabla).toEqual(enTarjetas);
    expect(screen.getByRole('radio', { name: 'Tabla' })).toBeChecked();
  });

  it('en la tabla, cada "Abrir" se distingue por el nombre y Producción lleva el punto verde', async () => {
    await renderPage({ vista: 'tabla' });
    expect(screen.getByRole('link', { name: 'Abrir Colegio Guillermo Brown' })).toHaveAttribute(
      'href',
      '/proyectos/agb',
    );
    const row = screen.getByRole('link', { name: 'Abrir Colegio Guillermo Brown' }).closest('tr')!;
    expect(
      within(row).getByText('Producción').querySelector('[aria-hidden="true"]'),
    ).toHaveAttribute('style', 'background: var(--status-prod);');
  });
});

describe('/proyectos con filtros en la URL', () => {
  it('aplica los filtros de la URL y cuenta "N de M"', async () => {
    await renderPage({ stack: 'Vercel', cms: 'Sin CMS' });
    expect(screen.getByText('2 de 6 proyectos')).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(2);
    expect(screen.getByRole('combobox', { name: 'Stack' })).toHaveValue('Vercel');
    expect(screen.getByRole('combobox', { name: 'CMS' })).toHaveValue('Sin CMS');
    expect(screen.getByRole('button', { name: 'Limpiar filtros' })).toBeInTheDocument();
  });

  it('la búsqueda llega al campo y filtra la tabla', async () => {
    await renderPage({ q: 'clinica', vista: 'tabla' });
    expect(screen.getByRole('searchbox', { name: 'Buscar' })).toHaveValue('clinica');
    const table = screen.getByRole('table', { name: 'Proyectos' });
    expect(within(table).getAllByRole('link', { name: /^Abrir / })).toHaveLength(1);
  });

  it('sin resultados muestra el vacío con "Limpiar filtros" (conserva la vista)', async () => {
    await renderPage({ q: 'no-existe', vista: 'tabla' });
    expect(screen.getByText('0 de 6 proyectos')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Ningún proyecto coincide' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Limpiar filtros' })).toHaveAttribute(
      'href',
      '/proyectos?vista=tabla',
    );
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
