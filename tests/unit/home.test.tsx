import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

describe('Home', () => {
  it('muestra el título de la app', () => {
    render(<Home />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Taller Freelancer' }),
    ).toBeInTheDocument();
  });
});
