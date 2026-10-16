import { render, screen } from '@testing-library/react';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';

describe('Field', () => {
  it('asocia el label al input sin pasar el id a mano', () => {
    render(
      <Field label="Nombre del proyecto" htmlFor="name">
        <Input />
      </Field>,
    );
    const input = screen.getByLabelText('Nombre del proyecto');
    expect(input.tagName).toBe('INPUT');
    expect(input).toHaveAttribute('id', 'name');
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('asocia también Select y Textarea', () => {
    render(
      <>
        <Field label="Estado" htmlFor="status">
          <Select>
            <option value="en_desarrollo">En desarrollo</option>
          </Select>
        </Field>
        <Field label="Descripción" htmlFor="description">
          <Textarea />
        </Field>
      </>,
    );
    expect(screen.getByLabelText('Estado').tagName).toBe('SELECT');
    expect(screen.getByLabelText('Descripción').tagName).toBe('TEXTAREA');
  });

  it('enlaza la ayuda con aria-describedby', () => {
    render(
      <Field label="Código" htmlFor="code" hint="Ejemplo: AGB-2026">
        <Input />
      </Field>,
    );
    expect(screen.getByLabelText('Código')).toHaveAccessibleDescription('Ejemplo: AGB-2026');
  });

  it('con error marca el input como inválido y describe el error', () => {
    render(
      <Field label="Cliente" htmlFor="client" hint="Nombre comercial" error="Completa el cliente.">
        <Input />
      </Field>,
    );
    const input = screen.getByLabelText('Cliente');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'client-hint client-error');
    expect(input).toHaveAccessibleDescription('Nombre comercial Completa el cliente.');
  });

  it('un input fuera de Field funciona igual con sus propias props', () => {
    render(<Input aria-label="Buscar" id="q" />);
    expect(screen.getByLabelText('Buscar')).toHaveAttribute('id', 'q');
  });
});
