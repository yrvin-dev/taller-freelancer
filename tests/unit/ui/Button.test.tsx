import { fireEvent, render, screen } from '@testing-library/react';
import { Button, buttonClass } from '@/components/ui/Button';

describe('Button', () => {
  it('es type="button" por defecto para no enviar formularios sin querer', () => {
    render(<Button>Guardar</Button>);
    expect(screen.getByRole('button', { name: 'Guardar' })).toHaveAttribute('type', 'button');
  });

  it('aplica la variante y el tono', () => {
    render(
      <>
        <Button>Primario</Button>
        <Button variant="secondary">Secundario</Button>
        <Button variant="primary" tone="danger">
          Sí, borrar
        </Button>
      </>,
    );
    expect(screen.getByRole('button', { name: 'Primario' })).toHaveClass(
      'bg-accent',
      'text-on-accent',
    );
    expect(screen.getByRole('button', { name: 'Secundario' })).toHaveClass('border-divider');
    expect(screen.getByRole('button', { name: 'Sí, borrar' })).toHaveClass(
      'bg-danger',
      'text-on-danger',
    );
  });

  it('el ghost usa padding horizontal reducido', () => {
    expect(buttonClass({ variant: 'ghost' })).toContain('px-1');
    expect(buttonClass({ variant: 'ghost' })).not.toContain('px-[calc');
  });

  it('muestra el ícono como decorativo', () => {
    const { container } = render(<Button icon="plus">Nuevo proyecto</Button>);
    const icon = container.querySelector('i');
    expect(icon).toHaveClass('fi', 'fi-rr-plus');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  it('el tipo exige aria-label en un botón solo-ícono', () => {
    // @ts-expect-error: falta aria-label
    const sinNombre = <Button iconOnly icon="trash" />;
    expect(sinNombre).toBeTruthy();
  });

  it('el botón solo-ícono se nombra con aria-label', () => {
    render(<Button iconOnly icon="trash" aria-label="Borrar entrada" variant="ghost" />);
    expect(screen.getByRole('button', { name: 'Borrar entrada' })).toHaveClass(
      'h-[36px]',
      'w-[36px]',
    );
  });

  it('loading deshabilita y marca aria-busy', () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Entrando…
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Entrando…' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('disabled no recibe hover (las clases de hover van con enabled:)', () => {
    expect(buttonClass()).toContain('enabled:hover:bg-accent-600');
    expect(buttonClass()).toContain('disabled:opacity-[.45]');
  });
});
