import { act, fireEvent, render, screen, within } from '@testing-library/react';
import ProjectPage from '@/app/(app)/proyectos/[id]/page';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { parseProjectTab } from '@/lib/projects';

async function renderProject(id: string, tab?: string) {
  const page = await ProjectPage({
    params: Promise.resolve({ id }),
    searchParams: Promise.resolve({ tab }),
  });
  return render(
    <ThemeProvider initialTheme="light">
      <ToastProvider>{page}</ToastProvider>
    </ThemeProvider>,
  );
}

describe('ficha: cabecera y pestañas', () => {
  it('muestra código, tipo, estado, nombre y la línea del cliente', async () => {
    await renderProject('snd');
    expect(screen.getByRole('heading', { level: 1, name: '(F) Sonrident · Control de citas' }));
    expect(screen.getByText('SND-2026')).toBeInTheDocument();
    expect(screen.getByText('Web app')).toBeInTheDocument();
    expect(screen.getByText('En desarrollo')).toBeInTheDocument();
    expect(
      screen.getByText(/^Clínica Dental Sonrident · Perú · Entrega \d+ \w+ \d{4}$/),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Proyectos' })).toHaveAttribute('href', '/proyectos');
    expect(screen.getByRole('link', { name: 'Editar' })).toHaveAttribute(
      'href',
      '/proyectos/snd/editar',
    );
  });

  it('las pestañas son enlaces con la activa marcada', async () => {
    await renderProject('snd', 'stack');
    const nav = screen.getByRole('navigation', { name: 'Secciones del proyecto' });
    expect(within(nav).getByRole('link', { name: 'Stack' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(nav).getByRole('link', { name: 'Resumen' })).toHaveAttribute(
      'href',
      '/proyectos/snd',
    );
    expect(within(nav).getByRole('link', { name: 'Cliente' })).toHaveAttribute(
      'href',
      '/proyectos/snd?tab=cliente',
    );
  });

  it('un id inexistente da 404', async () => {
    await expect(
      ProjectPage({ params: Promise.resolve({ id: 'nada' }), searchParams: Promise.resolve({}) }),
    ).rejects.toThrow();
  });

  it.each([
    ['cliente', 'cliente'],
    [undefined, 'resumen'],
    ['pagos', 'resumen'], // todavía no existe (T11b)
    ['<x>', 'resumen'],
  ] as const)('parseProjectTab(%s) → %s', (value, expected) => {
    expect(parseProjectTab(value)).toBe(expected);
  });
});

describe('pestaña Resumen', () => {
  it('accesos rápidos a sitio, CMS y diseño en otra pestaña, y copiar la ruta local', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    await renderProject('plv');

    const sitio = screen.getByRole('link', { name: /^Abrir sitio/ });
    expect(sitio).toHaveAttribute('href', 'https://polerastudio.pe');
    expect(sitio).toHaveAttribute('target', '_blank');
    expect(sitio).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByRole('link', { name: /^Abrir CMS/ })).toHaveAttribute(
      'href',
      'https://admin.polerastudio.pe',
    );

    await act(async () => {
      // El export copia la ruta desde los accesos rápidos y desde el dato: dos botones.
      fireEvent.click(screen.getAllByRole('button', { name: 'Copiar ruta local' })[0]!);
    });
    expect(writeText).toHaveBeenCalledWith('D:\\Proyectos\\clientes\\polera-studio');
    expect(screen.getByRole('status')).toHaveTextContent('Ruta copiada');
  });

  it('sin enlaces ni ruta: sin accesos rápidos, con "—" y "Por definir"', async () => {
    await renderProject('dfl');
    expect(screen.queryByRole('link', { name: /^Abrir/ })).not.toBeInTheDocument();
    expect(screen.getByText('Por definir')).toBeInTheDocument();
    expect(screen.getByText('No aplica')).toBeInTheDocument();
  });
});

describe('pestaña Cliente', () => {
  it('enlaza el correo y el WhatsApp', async () => {
    await renderProject('snd', 'cliente');
    expect(screen.getByRole('link', { name: 'admin@sonrident.pe' })).toHaveAttribute(
      'href',
      'mailto:admin@sonrident.pe',
    );
    expect(screen.getByRole('link', { name: /\+51 954 228 017/ })).toHaveAttribute(
      'href',
      'https://wa.me/51954228017',
    );
  });

  it('los datos vacíos se muestran como "—"', async () => {
    await renderProject('agw', 'cliente');
    expect(screen.getAllByText('—')).toHaveLength(4);
  });
});

describe('pestaña Stack', () => {
  it('frontend en acento, CMS en outline y "—" donde no hay', async () => {
    await renderProject('agb', 'stack');
    expect(screen.getByText('Astro')).toHaveClass('bg-accent-100');
    expect(screen.getByText('Sanity')).toHaveClass('border-accent');
    expect(screen.getAllByText('—')).toHaveLength(2); // backend y base de datos
  });
});
