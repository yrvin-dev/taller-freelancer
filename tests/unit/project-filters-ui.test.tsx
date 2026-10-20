import { act, fireEvent, render, screen } from '@testing-library/react';
import { ProjectFilters, SEARCH_DEBOUNCE_MS } from '@/components/projects/ProjectFilters';
import { filterProjects, NO_FILTERS, type ProjectFilters as Filters } from '@/lib/project-filters';
import { mockProjects } from '../fixtures/projects';

const nav = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: nav.replace }),
  usePathname: () => '/proyectos',
}));

const projects = mockProjects(new Date(2026, 9, 5));

function ui(value: Filters, view: 'tarjetas' | 'tabla' = 'tarjetas') {
  const { counts, stackOptions, cmsOptions } = filterProjects(projects, value);
  return (
    <ProjectFilters
      value={value}
      view={view}
      counts={counts}
      stackOptions={stackOptions}
      cmsOptions={cmsOptions}
    />
  );
}

beforeEach(() => nav.replace.mockClear());
afterEach(() => vi.useRealTimers());

describe('ProjectFilters', () => {
  it('cada filtro tiene su label y Estado muestra los contadores', () => {
    render(ui(NO_FILTERS));
    expect(screen.getByRole('searchbox', { name: 'Buscar' })).toHaveValue('');
    const estado = screen.getByRole('combobox', { name: 'Estado' });
    expect([...estado.querySelectorAll('option')].map((o) => o.textContent)).toEqual([
      'Todos (6)',
      'En desarrollo (4)',
      'Revisión (1)',
      'Producción (1)',
      'Mantenimiento (0)',
      'Archivado (0)',
    ]);
    expect(screen.getByRole('combobox', { name: 'Stack' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'CMS' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Limpiar filtros' })).not.toBeInTheDocument();
  });

  it('la búsqueda espera 300 ms sin teclear antes de escribir en la URL', () => {
    vi.useFakeTimers();
    render(ui(NO_FILTERS, 'tabla'));
    const search = screen.getByRole('searchbox', { name: 'Buscar' });
    fireEvent.change(search, { target: { value: 'pol' } });
    act(() => vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 50));
    fireEvent.change(search, { target: { value: 'polera ' } });
    act(() => vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 50));
    expect(nav.replace).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(50));
    expect(nav.replace).toHaveBeenCalledTimes(1);
    expect(nav.replace).toHaveBeenCalledWith('/proyectos?q=polera&vista=tabla', {
      scroll: false,
    });
  });

  it('los desplegables escriben en la URL al instante y conservan los demás filtros', () => {
    render(ui({ ...NO_FILTERS, q: 'agb' }));
    fireEvent.change(screen.getByRole('combobox', { name: 'Stack' }), {
      target: { value: 'Vercel' },
    });
    expect(nav.replace).toHaveBeenCalledWith('/proyectos?q=agb&stack=Vercel', { scroll: false });
  });

  it('"Limpiar filtros" quita todo menos la vista', () => {
    render(ui({ ...NO_FILTERS, estado: 'revision', cms: 'Sin CMS' }, 'tabla'));
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
    expect(nav.replace).toHaveBeenCalledWith('/proyectos?vista=tabla', { scroll: false });
  });

  it('si la URL cambia desde afuera (sidebar), el campo se actualiza sin reescribirla', () => {
    vi.useFakeTimers();
    const { rerender } = render(ui(NO_FILTERS));
    rerender(ui({ ...NO_FILTERS, q: 'sonrident' }));
    expect(screen.getByRole('searchbox', { name: 'Buscar' })).toHaveValue('sonrident');
    act(() => vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS * 2));
    expect(nav.replace).not.toHaveBeenCalled();
  });
});
