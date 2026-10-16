import { render, screen, within } from '@testing-library/react';
import Home from '@/app/(app)/page';
import { HomeDashboard, homeCards } from '@/components/projects/HomeDashboard';
import { ThemeProvider } from '@/components/ThemeProvider';
import { mockProjects } from '@/lib/mock/projects';

const NBSP = ' ';
const TODAY = new Date(2026, 9, 5);

function renderDashboard(projects = mockProjects(TODAY), hour = 9) {
  return render(
    <ThemeProvider initialTheme="light">
      <HomeDashboard projects={projects} today={TODAY} hour={hour} userName="Yrvin Huamán" />
    </ThemeProvider>,
  );
}

describe('HomeDashboard', () => {
  it('saluda según la hora y resume los proyectos', () => {
    renderDashboard(mockProjects(TODAY), 20);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Buenas noches, Yrvin' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('4 proyectos en desarrollo · 2 dominios por comprar · 3 saldos por cobrar.'),
    ).toBeInTheDocument();
  });

  it('las 3 cards muestran conteos y badges calculados', () => {
    renderDashboard();
    const entregas = screen.getByRole('heading', { name: 'Entregas próximas' }).closest('article')!;
    expect(within(entregas).getByText('3')).toBeInTheDocument();
    expect(
      within(entregas).getByRole('link', { name: /Polera Studio.*en 7 días/ }),
    ).toHaveAttribute('href', '/proyectos/plv');

    const vencer = screen.getByRole('heading', { name: 'Por vencer' }).closest('article')!;
    expect(within(vencer).getByText('4')).toBeInTheDocument();
    expect(within(vencer).getAllByText('Comprar')).toHaveLength(2);
    expect(within(vencer).getByText('en 14 días')).toBeInTheDocument();

    const pagos = screen.getByRole('heading', { name: 'Pagos pendientes' }).closest('article')!;
    expect(within(pagos).getByText('S/ 14,100')).toBeInTheDocument();
    expect(within(pagos).getByText(`Adelanto S/ 3,800 de S/ 9,500`)).toBeInTheDocument();
  });

  it('solo "Entregas próximas" es la card destacada', () => {
    renderDashboard();
    const destacadas = screen
      .getAllByRole('article')
      .filter((card) => card.classList.contains('bg-featured'));
    expect(destacadas).toHaveLength(1);
    expect(within(destacadas[0]!).getByRole('heading')).toHaveTextContent('Entregas próximas');
  });

  it('lista los 4 recientes con su fecha de actualización', () => {
    renderDashboard();
    const recientes = screen.getByRole('region', { name: 'Proyectos recientes' });
    const fichas = within(recientes).getAllByRole('link', { name: /^Abrir ficha de/ });
    expect(fichas.map((a) => a.getAttribute('href'))).toEqual([
      '/proyectos/snd',
      '/proyectos/agb',
      '/proyectos/agw',
      '/proyectos/dfl',
    ]);
    expect(within(recientes).getAllByText(/^Actualizado \d+ \w+$/)).toHaveLength(4);
  });

  it('sin proyectos muestra el estado vacío en lugar del panel', () => {
    renderDashboard([]);
    expect(screen.getByRole('heading', { name: 'Tu espacio está listo' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Crear mi primer proyecto' })).toHaveAttribute(
      'href',
      '/proyectos/nuevo',
    );
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });
});

describe('homeCards', () => {
  it('limita cada card a 3 ítems aunque haya más', () => {
    const [, vencer] = homeCards(mockProjects(TODAY), TODAY);
    expect(vencer!.count).toBe(4);
    expect(vencer!.items).toHaveLength(3);
  });
});

describe('Home (página)', () => {
  it('renderiza con los datos de prueba y el usuario mock', () => {
    render(
      <ThemeProvider initialTheme="light">
        <Home />
      </ThemeProvider>,
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/, Yrvin$/);
  });
});
