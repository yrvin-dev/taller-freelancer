import { render, screen } from '@testing-library/react';
import Home from '@/app/page';
import { ThemeProvider } from '@/components/ThemeProvider';

describe('Home', () => {
  it('muestra el título de la app', () => {
    render(
      <ThemeProvider initialTheme="light">
        <Home />
      </ThemeProvider>,
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'Taller Freelancer' }),
    ).toBeInTheDocument();
  });
});
