import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import EditProjectPage from '@/app/(app)/proyectos/[id]/editar/page';
import NewProjectPage from '@/app/(app)/proyectos/nuevo/page';
import { ThumbnailField, thumbnailError } from '@/components/projects/ThumbnailField';
import { ToastProvider } from '@/components/ui/Toast';

vi.mock('@/lib/data/projects', () => import('../fixtures/data-projects'));

// saveProject escribe en la base (probado en tests/integration/actions.test.ts): aquí
// se simula y se registra con qué se llamó.
const action = vi.hoisted(() => ({
  override: null as null | (() => unknown),
  calls: [] as [unknown, string | null][],
  push: vi.fn(),
}));
vi.mock('@/app/(app)/proyectos/actions', () => ({
  saveProject: async (input: unknown, id: string | null) => {
    action.calls.push([input, id]);
    return action.override ? action.override() : { ok: true, data: { id: 'id-guardado' } };
  },
}));
vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  useRouter: () => ({ push: action.push }),
}));

const withToast = (ui: React.ReactNode) => render(<ToastProvider>{ui}</ToastProvider>);

async function submit() {
  await act(async () => {
    fireEvent.click(screen.getAllByRole('button', { name: 'Guardar proyecto' })[0]!);
  });
}

describe('/proyectos/nuevo', () => {
  beforeEach(() => {
    action.override = null;
    action.calls = [];
    action.push.mockClear();
  });

  it('tiene las secciones del export (sin Editores CMS) y los campos de crear', () => {
    withToast(<NewProjectPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Nuevo proyecto' })).toBeInTheDocument();
    for (const section of ['General', 'Cliente', 'Stack', 'Accesos', 'Pagos', 'Notas']) {
      expect(screen.getByRole('group', { name: section })).toBeInTheDocument();
    }
    expect(screen.queryByRole('group', { name: 'Editores CMS' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Adelanto (S/)')).toBeInTheDocument();
    expect(screen.getByLabelText('Primera entrada de la bitácora')).toBeInTheDocument();
  });

  it('vacío: errores en cada campo obligatorio, resumen y foco en el primero', async () => {
    withToast(<NewProjectPage />);
    await submit();

    const name = screen.getByLabelText('Nombre del proyecto *');
    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(name).toHaveAccessibleDescription('Completa el nombre del proyecto.');
    expect(screen.getByLabelText('Cliente *')).toHaveAccessibleDescription('Completa el cliente.');
    expect(screen.getByRole('alert')).toHaveTextContent('Revisa los campos marcados.');
    expect(name).toHaveFocus();
  });

  it('valida formatos en el cliente con el mismo esquema (enlace javascript:)', async () => {
    withToast(<NewProjectPage />);
    fireEvent.change(screen.getByLabelText('Nombre del proyecto *'), { target: { value: 'AGB' } });
    fireEvent.change(screen.getByLabelText('Cliente *'), { target: { value: 'Colegio' } });
    fireEvent.change(screen.getByLabelText('Repositorio'), {
      target: { value: 'javascript:alert(1)' },
    });
    await submit();
    expect(screen.getByLabelText('Repositorio')).toHaveAccessibleDescription(
      'Usa un enlace http(s) o un dominio (ej. polerastudio.pe).',
    );
  });

  it('pinta en los campos los errores que devuelve el servidor', async () => {
    action.override = () => ({
      ok: false,
      error: 'Revisa los campos marcados.',
      fieldErrors: { code: 'Ese código ya existe.' },
    });
    withToast(<NewProjectPage />);
    fireEvent.change(screen.getByLabelText('Nombre del proyecto *'), { target: { value: 'AGB' } });
    fireEvent.change(screen.getByLabelText('Cliente *'), { target: { value: 'Colegio' } });
    await submit();
    await waitFor(() =>
      expect(screen.getByLabelText('Código')).toHaveAccessibleDescription('Ese código ya existe.'),
    );
  });

  it('con datos válidos guarda, avisa y lleva a la ficha', async () => {
    withToast(<NewProjectPage />);
    fireEvent.change(screen.getByLabelText('Nombre del proyecto *'), { target: { value: 'AGB' } });
    fireEvent.change(screen.getByLabelText('Cliente *'), { target: { value: 'Colegio' } });
    await submit();
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Proyecto creado'));
    expect(action.push).toHaveBeenCalledWith('/proyectos/id-guardado');
    // Al servidor van los valores crudos del formulario (los vuelve a validar).
    const [input, id] = action.calls.at(-1)!;
    expect(id).toBeNull();
    expect(input).toMatchObject({ name: 'AGB', client: 'Colegio' });
  });

  it('con datos inválidos no llama al servidor', async () => {
    withToast(<NewProjectPage />);
    await submit();
    expect(action.calls).toHaveLength(0);
  });
});

describe('/proyectos/[id]/editar', () => {
  async function renderEdit(id: string) {
    const page = await EditProjectPage({ params: Promise.resolve({ id }) });
    return withToast(page);
  }

  it('precarga el proyecto y oculta adelanto y primera nota', async () => {
    await renderEdit('plv');
    expect(
      screen.getByRole('heading', { level: 1, name: 'Editar · (F) Polera Studio · E-commerce' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre del proyecto *')).toHaveValue(
      '(F) Polera Studio · E-commerce',
    );
    expect(screen.getByLabelText('Frontend')).toHaveValue('Next.js, Tailwind, Motion, Lenis');
    expect(screen.getByLabelText('Monto total (S/)')).toHaveValue('7800');
    expect(screen.queryByLabelText('Adelanto (S/)')).not.toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Notas' })).not.toBeInTheDocument();
    // Descartar está arriba y abajo, como en el export.
    for (const link of screen.getAllByRole('link', { name: 'Descartar' })) {
      expect(link).toHaveAttribute('href', '/proyectos/plv');
    }
  });

  it('un CMS fuera de la lista sigue disponible en el select', async () => {
    await renderEdit('plv');
    expect(screen.getByLabelText('CMS')).toHaveValue('Medusa Admin');
  });

  it('un id inexistente da 404', async () => {
    await expect(EditProjectPage({ params: Promise.resolve({ id: 'nada' }) })).rejects.toThrow();
  });
});

describe('miniatura', () => {
  it('thumbnailError valida tipo y peso', () => {
    expect(thumbnailError({ type: 'image/png', size: 500_000 })).toBeNull();
    expect(thumbnailError({ type: 'image/gif', size: 1 })).toBe('Usa una imagen PNG, JPG o WebP.');
    expect(thumbnailError({ type: 'image/jpeg', size: 3_000_000 })).toBe(
      'La imagen pesa más de 2 MB.',
    );
  });

  it('muestra la vista previa o el error', () => {
    URL.createObjectURL = vi.fn(() => 'blob:preview');
    URL.revokeObjectURL = vi.fn();
    render(<ThumbnailField initialUrl={null} />);
    const input = screen.getByLabelText('Miniatura del proyecto');

    fireEvent.change(input, {
      target: { files: [new File(['x'], 'a.gif', { type: 'image/gif' })] },
    });
    expect(screen.getByRole('alert')).toHaveTextContent('Usa una imagen PNG, JPG o WebP.');
    expect(input).toHaveAttribute('aria-invalid', 'true');

    fireEvent.change(input, {
      target: { files: [new File(['x'], 'a.png', { type: 'image/png' })] },
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByAltText('Vista previa de la miniatura')).toHaveAttribute(
      'src',
      'blob:preview',
    );
  });
});
