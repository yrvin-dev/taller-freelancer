import { render, screen } from '@testing-library/react';
import AuthLayout from '@/app/(auth)/layout';
import PrivacyPage from '@/app/(auth)/privacidad/page';

// Página pública que Google exige para publicar el login (T27).
describe('/privacidad', () => {
  it('tiene el título, la vigencia y un apartado por tema', () => {
    render(
      <AuthLayout>
        <PrivacyPage />
      </AuthLayout>,
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'Política de privacidad' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Vigente desde el/)).toBeInTheDocument();
    const sections = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(sections).toEqual([
      'Quién es responsable',
      'Qué datos usamos',
      'Para qué los usamos',
      'Dónde se guardan y cómo se protegen',
      'Tus derechos',
      'Cambios en esta política',
    ]);
  });

  it('da un contacto y vuelve al inicio', () => {
    render(<PrivacyPage />);
    for (const link of screen.getAllByRole('link', { name: 'yrvin.dev@gmail.com' })) {
      expect(link).toHaveAttribute('href', 'mailto:yrvin.dev@gmail.com');
    }
    expect(screen.getByRole('link', { name: 'Volver' })).toHaveAttribute('href', '/');
  });
});
