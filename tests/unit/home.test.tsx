import { render, screen } from '@testing-library/react';
import Home from '@/app/(app)/page';

describe('Home', () => {
  it('muestra el título de la página', () => {
    render(<Home />);
    expect(screen.getByRole('heading', { level: 1, name: 'Inicio' })).toBeInTheDocument();
  });
});
