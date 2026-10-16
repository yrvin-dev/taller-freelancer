import { fireEvent, render, screen } from '@testing-library/react';
import AuthLayout from '@/app/(auth)/layout';
import LoginPage from '@/app/(auth)/login/page';

function renderLogin() {
  return render(
    <AuthLayout>
      <LoginPage />
    </AuthLayout>,
  );
}

describe('Login', () => {
  it('muestra el hero y el acceso con los textos del export', () => {
    renderLogin();
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Cada proyecto de cliente, ordenado en una sola ficha.',
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Inicia sesión' })).toBeInTheDocument();
    expect(screen.getByText('Cada cuenta ve solo sus proyectos.')).toHaveClass('text-on-ink-muted');
  });

  it('el botón de Google avisa con un toast hasta conectar auth (sin selector simulado)', () => {
    renderLogin();
    const button = screen.getByRole('button', { name: 'Continuar con Google' });
    expect(button.querySelector('i')).toHaveClass('fi-brands-google');

    fireEvent.click(button);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Disponible al conectar Google');
    expect(status.querySelector('i')).toHaveClass('fi-rr-info');
    // Fuera del shell no hay BottomNav: el toast no sube.
    expect(status.firstElementChild).toHaveClass('bottom-6');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
