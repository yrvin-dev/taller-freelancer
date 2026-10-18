import { fireEvent, render, screen } from '@testing-library/react';
import ForbiddenPage from '@/app/(app)/403/page';
import AppError from '@/app/(app)/error';
import AppNotFound from '@/app/(app)/not-found';
import RootNotFound from '@/app/not-found';
import { SessionExpiredDialog } from '@/components/SessionExpiredDialog';

describe('ErrorScreen', () => {
  it('403: título, código y acciones del export', () => {
    render(<ForbiddenPage />);
    expect(screen.getByText('ERROR 403')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'No tienes acceso a este proyecto' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir a mis proyectos' })).toHaveAttribute(
      'href',
      '/proyectos',
    );
    expect(
      screen.getByRole('button', { name: 'Cambiar de cuenta' }).closest('form'),
    ).toHaveAttribute('action', '/auth/signout');
  });

  it('404 dentro y fuera del shell', () => {
    const { unmount } = render(<AppNotFound />);
    expect(screen.getByText('ERROR 404')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'No encontramos esta página' })).toBeInTheDocument();
    unmount();

    render(<RootNotFound />);
    expect(screen.getByRole('main')).toContainElement(
      screen.getByRole('heading', { name: 'No encontramos esta página' }),
    );
  });

  it('error: "Reintentar" llama a reset y no muestra datos del error', () => {
    const reset = vi.fn();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <AppError
        error={Object.assign(new Error('fallo interno'), { digest: 'abc123' })}
        reset={reset}
      />,
    );
    expect(screen.getByText('ERROR')).toBeInTheDocument();
    expect(screen.queryByText(/fallo interno|abc123/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(reset).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('Error en la app', 'abc123');
    spy.mockRestore();
  });
});

describe('SessionExpiredDialog (401)', () => {
  function renderDialog() {
    const onRelogin = vi.fn();
    const onExit = vi.fn();
    render(<SessionExpiredDialog open onRelogin={onRelogin} onExit={onExit} />);
    return { onRelogin, onExit, dialog: screen.getByRole('dialog', { name: 'Tu sesión expiró' }) };
  }

  it('se abre como modal con su descripción', () => {
    const { dialog } = renderDialog();
    expect(dialog).toHaveAttribute('open');
    expect(dialog).toHaveAccessibleDescription(/Por seguridad cerramos tu sesión/);
    expect(screen.getByText('ERROR 401')).toBeInTheDocument();
  });

  it('no se cierra con Esc ni con un clic en el fondo', () => {
    const { dialog, onExit } = renderDialog();
    const cancel = new Event('cancel', { cancelable: true });
    fireEvent(dialog, cancel);
    expect(cancel.defaultPrevented).toBe(true);
    fireEvent.click(dialog);
    expect(dialog).toHaveAttribute('open');
    expect(onExit).not.toHaveBeenCalled();
  });

  it('solo se sale volviendo a entrar o saliendo', () => {
    const { onRelogin, onExit } = renderDialog();
    fireEvent.click(screen.getByRole('button', { name: 'Entrar de nuevo con Google' }));
    fireEvent.click(screen.getByRole('button', { name: 'Salir' }));
    expect(onRelogin).toHaveBeenCalledTimes(1);
    expect(onExit).toHaveBeenCalledTimes(1);
  });
});
