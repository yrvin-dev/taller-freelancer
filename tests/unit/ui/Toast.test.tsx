import { act, fireEvent, render, screen } from '@testing-library/react';
import { TOAST_DURATION_MS, ToastProvider, useToast } from '@/components/ui/Toast';

function Trigger({ message }: { message: string }) {
  const toast = useToast();
  return <button onClick={() => toast.show(message)}>{message}</button>;
}

describe('Toast', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('anuncia el mensaje en una región status y se va solo', () => {
    render(
      <ToastProvider>
        <Trigger message="Proyecto creado" />
      </ToastProvider>,
    );
    const region = screen.getByRole('status');
    expect(region).toBeEmptyDOMElement();

    fireEvent.click(screen.getByRole('button', { name: 'Proyecto creado' }));
    expect(region).toHaveTextContent('Proyecto creado');
    expect(region.querySelector('i')).toHaveClass('fi-rr-check-circle');

    act(() => vi.advanceTimersByTime(TOAST_DURATION_MS));
    expect(region).toBeEmptyDOMElement();
  });

  it('un toast nuevo reemplaza al anterior y reinicia el tiempo', () => {
    render(
      <ToastProvider>
        <Trigger message="Enlace copiado" />
        <Trigger message="Cambios guardados" />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Enlace copiado' }));
    act(() => vi.advanceTimersByTime(TOAST_DURATION_MS - 200));
    fireEvent.click(screen.getByRole('button', { name: 'Cambios guardados' }));

    const region = screen.getByRole('status');
    expect(region).toHaveTextContent('Cambios guardados');
    expect(region).not.toHaveTextContent('Enlace copiado');

    act(() => vi.advanceTimersByTime(TOAST_DURATION_MS - 200));
    expect(region).toHaveTextContent('Cambios guardados');
    act(() => vi.advanceTimersByTime(200));
    expect(region).toBeEmptyDOMElement();
  });

  it('aboveNav sube el toast en mobile para no tapar la BottomNav', () => {
    render(
      <ToastProvider aboveNav>
        <Trigger message="Nota agregada" />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Nota agregada' }));
    const toast = screen.getByRole('status').firstElementChild;
    expect(toast?.className).toContain('bottom-[calc(84px+env(safe-area-inset-bottom))]');
    expect(toast).toHaveClass('shell:bottom-6');
  });

  it('useToast fuera del provider falla con un mensaje claro', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Trigger message="x" />)).toThrow(/ToastProvider/);
    spy.mockRestore();
  });
});
