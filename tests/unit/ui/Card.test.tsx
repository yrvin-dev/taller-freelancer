import { render, screen } from '@testing-library/react';
import { Card } from '@/components/ui/Card';

describe('Card', () => {
  it('es un div sin borde con sombra sm por defecto', () => {
    const { container } = render(<Card>Contenido</Card>);
    const card = container.firstElementChild;
    expect(card?.tagName).toBe('DIV');
    expect(card).toHaveClass('bg-surface', 'shadow-sm', 'rounded-md');
    expect(card).not.toHaveClass('hover:-translate-y-px');
  });

  it('puede ser un article con otra elevación', () => {
    const { container } = render(
      <Card as="article" elevation="lg">
        x
      </Card>,
    );
    expect(container.firstElementChild?.tagName).toBe('ARTICLE');
    expect(container.firstElementChild).toHaveClass('shadow-lg');
  });

  it('como enlace navega y eleva al hover', () => {
    render(
      <Card as="a" href="/proyectos/agb">
        Colegio Guillermo Brown
      </Card>,
    );
    const link = screen.getByRole('link', { name: 'Colegio Guillermo Brown' });
    expect(link).toHaveAttribute('href', '/proyectos/agb');
    expect(link).toHaveClass('hover:shadow-md', 'hover:-translate-y-px');
  });

  it('featured usa el degradado y texto on-accent', () => {
    const { container } = render(<Card featured>Entregas próximas</Card>);
    expect(container.firstElementChild).toHaveClass('bg-featured', 'text-on-accent');
  });
});
