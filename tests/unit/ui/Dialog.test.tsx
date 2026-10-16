import { fireEvent, render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';

function renderDialog(open: boolean, onClose = vi.fn()) {
  const utils = render(
    <Dialog
      open={open}
      title="¿Eliminar Colegio Guillermo Brown?"
      onClose={onClose}
      actions={<Button tone="danger">Eliminar</Button>}
    >
      Se borrará la ficha con sus accesos, pagos y bitácora.
    </Dialog>,
  );
  return { ...utils, onClose };
}

describe('Dialog', () => {
  it('abierto es un diálogo nombrado por su título', () => {
    renderDialog(true);
    const dialog = screen.getByRole('dialog', { name: '¿Eliminar Colegio Guillermo Brown?' });
    expect(dialog).toHaveAttribute('open');
    expect(screen.getByRole('button', { name: 'Eliminar' })).toBeInTheDocument();
  });

  it('cerrado no se muestra', () => {
    renderDialog(false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('Esc (evento cancel) llama a onClose y no cierra por su cuenta', () => {
    const { onClose } = renderDialog(true);
    const dialog = screen.getByRole('dialog');
    const cancel = new Event('cancel', { cancelable: true });
    fireEvent(dialog, cancel);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(cancel.defaultPrevented).toBe(true);
    expect(dialog).toHaveAttribute('open');
  });

  it('el clic en el fondo cierra; el clic en el contenido no', () => {
    const { onClose } = renderDialog(true);
    fireEvent.click(screen.getByText(/Se borrará la ficha/));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('al pasar open a false se cierra', () => {
    const { rerender } = renderDialog(true);
    rerender(
      <Dialog open={false} title="¿Eliminar Colegio Guillermo Brown?" onClose={vi.fn()}>
        x
      </Dialog>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
