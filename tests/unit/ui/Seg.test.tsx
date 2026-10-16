import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { Seg } from '@/components/ui/Seg';

type View = 'tarjetas' | 'tabla';

function ViewSwitch({ onChange }: { onChange?: (v: View) => void }) {
  const [view, setView] = useState<View>('tarjetas');
  return (
    <Seg<View>
      name="view"
      label="Vista"
      value={view}
      options={[
        { value: 'tarjetas', label: 'Tarjetas', icon: 'apps' },
        { value: 'tabla', label: 'Tabla', icon: 'list' },
      ]}
      onChange={(v) => {
        setView(v);
        onChange?.(v);
      }}
    />
  );
}

describe('Seg', () => {
  it('es un grupo de radios con nombre accesible', () => {
    render(<ViewSwitch />);
    expect(screen.getByRole('radiogroup', { name: 'Vista' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Tarjetas' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Tabla' })).not.toBeChecked();
  });

  it('cambia de opción y avisa el valor', () => {
    const onChange = vi.fn();
    render(<ViewSwitch onChange={onChange} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Tabla' }));
    expect(onChange).toHaveBeenCalledWith('tabla');
    expect(screen.getByRole('radio', { name: 'Tabla' })).toBeChecked();
  });

  it('la opción elegida usa acento con texto on-accent', () => {
    render(<ViewSwitch />);
    const selected = screen.getByRole('radio', { name: 'Tarjetas' }).closest('label');
    const other = screen.getByRole('radio', { name: 'Tabla' }).closest('label');
    expect(selected).toHaveClass('bg-accent', 'text-on-accent');
    expect(other).not.toHaveClass('bg-accent');
    expect(other).toHaveClass('border-l');
  });
});
