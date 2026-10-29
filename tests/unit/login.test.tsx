import { render, screen } from '@testing-library/react';
import AuthLayout from '@/app/(auth)/layout';
import LoginPage from '@/app/(auth)/login/page';

vi.mock('@/app/(auth)/login/actions', () => ({ signInWithGoogle: vi.fn() }));

async function renderLogin(params: { next?: string; error?: string; cuenta?: string } = {}) {
  const page = await LoginPage({ searchParams: Promise.resolve(params) });
  return render(<AuthLayout>{page}</AuthLayout>);
}

describe('Login', () => {
  it('muestra el hero y el acceso con los textos del export', async () => {
    await renderLogin();
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Cada proyecto de cliente, ordenado en una sola ficha.',
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Inicia sesión' })).toBeInTheDocument();
    expect(screen.getByText('Cada cuenta ve solo sus proyectos.')).toHaveClass('text-on-ink-muted');
  });

  it('"Continuar con Google" envía el formulario de la Server Action', async () => {
    await renderLogin();
    const button = screen.getByRole('button', { name: 'Continuar con Google' });
    expect(button).toHaveAttribute('type', 'submit');
    expect(button.closest('form')).not.toBeNull();
    expect(button.querySelector('i')).toHaveClass('fi-brands-google');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('enlaza la política de privacidad desde el texto sobre los datos', async () => {
    await renderLogin();
    expect(screen.getByRole('link', { name: 'Política de privacidad' })).toHaveAttribute(
      'href',
      '/privacidad',
    );
  });

  it('conserva el destino (?next) en el formulario', async () => {
    const { container } = await renderLogin({ next: '/proyectos/agb' });
    expect(container.querySelector('input[name="next"]')).toHaveValue('/proyectos/agb');
  });

  it.each([
    ['auth', 'No pudimos completar el inicio de sesión. Inténtalo de nuevo.'],
    ['oauth', 'No pudimos conectar con Google. Inténtalo de nuevo.'],
    ['<script>', 'No pudimos completar el inicio de sesión. Inténtalo de nuevo.'],
  ])('error=%s muestra un mensaje fijo (nunca el texto de la URL)', async (error, message) => {
    await renderLogin({ error });
    expect(screen.getByRole('alert')).toHaveTextContent(message);
  });

  it('tras borrar la cuenta muestra el aviso', async () => {
    await renderLogin({ cuenta: 'borrada' });
    // Hay dos role="status": este aviso y la región del toast (siempre montada).
    expect(screen.getByText('Tu cuenta y todos tus datos se borraron.')).toHaveAttribute(
      'role',
      'status',
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
