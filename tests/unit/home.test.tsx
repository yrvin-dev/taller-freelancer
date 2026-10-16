import { render, screen } from '@testing-library/react';
import Home from '@/app/(app)/page';
import { ThemeProvider } from '@/components/ThemeProvider';

describe('Home', () => {
  it('muestra el encabezado con la acción principal', () => {
    render(
      <ThemeProvider initialTheme="light">
        <Home />
      </ThemeProvider>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Inicio' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Nuevo proyecto' })).toHaveAttribute(
      'href',
      '/proyectos/nuevo',
    );
  });
});
