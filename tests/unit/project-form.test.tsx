import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import EditProjectPage from '@/app/(app)/proyectos/[id]/editar/page';
import NewProjectPage from '@/app/(app)/proyectos/nuevo/page';
import { ActionFeedbackProvider } from '@/components/ActionFeedback';
import { ThumbnailField } from '@/components/projects/ThumbnailField';
import { thumbnailError } from '@/lib/thumbnails';

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
const thumb = vi.hoisted(() => ({
  calls: [] as [string, string, File | null][],
  result: { ok: true, data: undefined } as unknown,
}));
vi.mock('@/app/(app)/proyectos/[id]/actions', () => ({
  saveThumbnail: async (id: string, data: FormData) => {
    thumb.calls.push(['save', id, data.get('thumbnail') as File]);
    return thumb.result;
  },
  removeThumbnail: async (id: string) => {
    thumb.calls.push(['remove', id, null]);
    return thumb.result;
  },
}));
vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  useRouter: () => ({ push: action.push }),
}));

const withToast = (ui: React.ReactNode) =>
  render(<ActionFeedbackProvider>{ui}</ActionFeedbackProvider>);

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

  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:preview');
    URL.revokeObjectURL = vi.fn();
    thumb.calls = [];
    thumb.result = { ok: true, data: undefined };
    action.override = null;
    action.push.mockClear();
  });

  const png = () => new File(['x'], 'a.png', { type: 'image/png' });

  it('muestra la vista previa o el error, y avisa solo los archivos válidos', () => {
    const onChange = vi.fn();
    render(<ThumbnailField initialUrl={null} onChange={onChange} />);
    const input = screen.getByLabelText('Miniatura del proyecto');

    fireEvent.change(input, {
      target: { files: [new File(['x'], 'a.gif', { type: 'image/gif' })] },
    });
    expect(screen.getByRole('alert')).toHaveTextContent('Usa una imagen PNG, JPG o WebP.');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(onChange).not.toHaveBeenCalled();

    const file = png();
    fireEvent.change(input, { target: { files: [file] } });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByAltText('Vista previa de la miniatura')).toHaveAttribute(
      'src',
      'blob:preview',
    );
    expect(onChange).toHaveBeenLastCalledWith({ file });

    fireEvent.click(screen.getByRole('button', { name: 'Quitar imagen nueva' }));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('quita la miniatura actual y se puede recuperar', () => {
    const onChange = vi.fn();
    render(<ThumbnailField initialUrl="/mock/thumbs/a.webp" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Quitar miniatura' }));
    expect(onChange).toHaveBeenLastCalledWith('remove');
    expect(screen.queryByAltText('Vista previa de la miniatura')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Recuperar miniatura' }));
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(screen.getByAltText('Vista previa de la miniatura')).toBeInTheDocument();
  });

  it('al guardar, sube la miniatura con el id del proyecto recién guardado', async () => {
    withToast(<NewProjectPage />);
    fireEvent.change(screen.getByLabelText('Nombre del proyecto *'), {
      target: { value: 'Polera' },
    });
    fireEvent.change(screen.getByLabelText('Cliente *'), { target: { value: 'Polera SAC' } });
    const file = png();
    fireEvent.change(screen.getByLabelText('Miniatura del proyecto'), {
      target: { files: [file] },
    });
    await submit();

    expect(thumb.calls).toEqual([['save', 'id-guardado', file]]);
    expect(action.push).toHaveBeenCalledWith('/proyectos/id-guardado');
    expect(screen.getByText('Proyecto creado')).toBeInTheDocument();
  });

  it('sin cambios en la miniatura no la toca', async () => {
    withToast(<NewProjectPage />);
    fireEvent.change(screen.getByLabelText('Nombre del proyecto *'), {
      target: { value: 'Polera' },
    });
    fireEvent.change(screen.getByLabelText('Cliente *'), { target: { value: 'Polera SAC' } });
    await submit();
    expect(thumb.calls).toEqual([]);
  });

  it('si falla la miniatura, el proyecto ya está guardado: va a la ficha con el error', async () => {
    thumb.result = { ok: false, error: 'No pudimos guardar la miniatura.' };
    withToast(<NewProjectPage />);
    fireEvent.change(screen.getByLabelText('Nombre del proyecto *'), {
      target: { value: 'Polera' },
    });
    fireEvent.change(screen.getByLabelText('Cliente *'), { target: { value: 'Polera SAC' } });
    fireEvent.change(screen.getByLabelText('Miniatura del proyecto'), {
      target: { files: [png()] },
    });
    await submit();

    expect(screen.getByText('No pudimos guardar la miniatura.')).toBeInTheDocument();
    expect(screen.queryByText('Proyecto creado')).not.toBeInTheDocument();
    expect(action.push).toHaveBeenCalledWith('/proyectos/id-guardado');
  });
});
