import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { revealCredential } from '@/app/(app)/proyectos/[id]/actions';
import ProjectPage from '@/app/(app)/proyectos/[id]/page';
import { CredentialRow, REVEAL_MS } from '@/components/projects/detail/CredentialRow';
import { NoteLog } from '@/components/projects/detail/NoteLog';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ToastProvider } from '@/components/ui/Toast';

vi.mock('@/lib/data/projects', () => import('../fixtures/data-projects'));

const writes = vi.hoisted(() => ({
  addNote: vi.fn(),
  deleteNote: vi.fn(),
  deleteProject: vi.fn(),
  archiveProject: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock('@/app/(app)/proyectos/[id]/actions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/app/(app)/proyectos/[id]/actions')>()),
  addNote: writes.addNote,
  deleteNote: writes.deleteNote,
  deleteProject: writes.deleteProject,
  archiveProject: writes.archiveProject,
}));
vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  useRouter: () => ({ push: writes.push, refresh: writes.refresh }),
}));

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

describe('revealCredential (Server Action)', () => {
  it('devuelve el secreto de una credencial del proyecto', async () => {
    await expect(revealCredential({ projectId: 'plv', credentialId: 'plv-c1' })).resolves.toEqual({
      ok: true,
      data: { secret: 'demo-medusa-admin-2026' },
    });
  });

  it('rechaza entradas inválidas y credenciales de otro proyecto', async () => {
    await expect(revealCredential({ projectId: '../x', credentialId: 'a' })).resolves.toMatchObject(
      {
        ok: false,
      },
    );
    await expect(revealCredential('plv:plv-c1')).resolves.toMatchObject({ ok: false });
    await expect(revealCredential({ projectId: 'snd', credentialId: 'plv-c1' })).resolves.toEqual({
      ok: false,
      error: 'No encontramos esa credencial.',
    });
  });
});

describe('pestaña Accesos', () => {
  it('cada enlace tiene Abrir y Copiar con nombre propio', async () => {
    await renderProject('plv', 'accesos');
    expect(screen.getByRole('link', { name: /^Abrir Repositorio/ })).toHaveAttribute(
      'href',
      'https://github.com/devfreelance/polera-studio',
    );
    expect(screen.getByRole('button', { name: 'Copiar Repositorio' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copiar Ruta local' })).toBeInTheDocument();
  });

  it('el secreto no está en el HTML inicial', async () => {
    const { container } = await renderProject('plv', 'accesos');
    expect(container.innerHTML).not.toContain('demo-');
    expect(screen.getAllByText('Contraseña oculta')).toHaveLength(2);
  });

  it('vencimientos: dominio por comprar y hosting sin fecha', async () => {
    await renderProject('agb', 'accesos');
    const vencimientos = screen.getByRole('region', { name: 'Vencimientos' });
    expect(within(vencimientos).getByText('Pendiente de compra')).toBeInTheDocument();
    expect(within(vencimientos).getByText('Por comprar')).toHaveClass('bg-accent-2-100');
    expect(within(vencimientos).getByText('Sin fecha')).toBeInTheDocument();
    expect(within(vencimientos).getByText('No aplica')).toHaveClass('bg-neutral-100');
  });

  it('vencimientos con fecha: coral a 30 días o menos', async () => {
    await renderProject('snd', 'accesos');
    expect(screen.getByText('Vence en 23 días')).toHaveClass('bg-accent-2-100');
    expect(screen.getByText('Vence en 41 días')).toHaveClass('bg-neutral-100');
  });

  it('sin credenciales muestra el estado vacío', async () => {
    await renderProject('agw', 'accesos');
    expect(
      screen.getByText('Sin credenciales guardadas. Agrégalas desde Editar.'),
    ).toBeInTheDocument();
  });
});

describe('CredentialRow', () => {
  const credential = { id: 'plv-c1', label: 'Medusa Admin', username: 'admin', url: null };

  function renderRow() {
    return render(
      <ToastProvider>
        <dl>
          <CredentialRow projectId="plv" credential={credential} />
        </dl>
      </ToastProvider>,
    );
  }

  afterEach(() => vi.useRealTimers());

  it('Mostrar trae el secreto y se vuelve a tapar a los 30 s', async () => {
    vi.useFakeTimers();
    renderRow();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña de Medusa Admin' }));
    });
    expect(screen.getByText('demo-medusa-admin-2026')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ocultar contraseña de Medusa Admin' }));

    act(() => vi.advanceTimersByTime(REVEAL_MS));
    expect(screen.queryByText('demo-medusa-admin-2026')).not.toBeInTheDocument();
    expect(screen.getByText('Contraseña oculta')).toBeInTheDocument();
  });

  it('Copiar copia sin mostrar el secreto', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    renderRow();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copiar contraseña de Medusa Admin' }));
    });
    expect(writeText).toHaveBeenCalledWith('demo-medusa-admin-2026');
    expect(screen.queryByText('demo-medusa-admin-2026')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Contraseña copiada');
  });
});

describe('pestaña Pagos', () => {
  it('muestra total, pagado y saldo, la barra y la lista', async () => {
    await renderProject('snd', 'pagos');
    expect(screen.getByText('S/ 9,500.00')).toBeInTheDocument();
    expect(screen.getAllByText('S/ 3,800.00')).toHaveLength(2); // figura y fila del pago
    expect(screen.getByText('S/ 5,700.00')).toHaveClass('text-accent-2-700');
    expect(screen.getByRole('progressbar', { name: 'Cobrado' })).toHaveAttribute(
      'aria-valuenow',
      '40',
    );
    expect(screen.getByText('40% cobrado · soles (PEN)')).toBeInTheDocument();
    expect(screen.getByText('Adelanto')).toBeInTheDocument();
  });

  it('sin monto: "Sin registrar" y sin lista', async () => {
    await renderProject('dfl', 'pagos');
    expect(screen.getByText('Sin registrar')).toBeInTheDocument();
    expect(screen.getByText('Registra el monto desde Editar.')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Pagos' })).not.toBeInTheDocument();
  });
});

describe('NoteLog', () => {
  beforeEach(() => vi.clearAllMocks());

  function renderLog(
    notes = [{ id: 'n1', kind: 'pedido' as const, body: 'Zoom 360', notedOn: '2026-10-01' }],
  ) {
    return render(
      <ToastProvider>
        <NoteLog projectId="p1" initialNotes={notes} />
      </ToastProvider>,
    );
  }

  it('agrega con addNote y pone arriba lo que devuelve la base', async () => {
    writes.addNote.mockResolvedValue({
      ok: true,
      data: { id: 'n2', kind: 'cambio', body: 'Checkout con Yape', notedOn: '2026-10-16' },
    });
    renderLog();
    const add = screen.getByRole('button', { name: 'Agregar a la bitácora' });
    expect(add).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Tipo de entrada'), { target: { value: 'cambio' } });
    fireEvent.change(screen.getByLabelText('Entrada de la bitácora'), {
      target: { value: '  Checkout con Yape ' },
    });
    await act(async () => fireEvent.click(add));

    expect(writes.addNote).toHaveBeenCalledWith({
      projectId: 'p1',
      kind: 'cambio',
      body: 'Checkout con Yape',
    });
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('16 oct 2026');
    expect(within(items[0]!).getByText('Cambio')).toHaveClass('bg-accent-100');
    expect(screen.getByRole('status')).toHaveTextContent('Nota agregada');
    expect(screen.getByLabelText('Entrada de la bitácora')).toHaveValue('');
  });

  it('si la base falla, avisa y conserva el borrador', async () => {
    writes.addNote.mockResolvedValue({ ok: false, error: 'No pudimos guardar la entrada.' });
    renderLog();
    fireEvent.change(screen.getByLabelText('Entrada de la bitácora'), {
      target: { value: 'Algo' },
    });
    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Agregar a la bitácora' })),
    );
    expect(screen.getByRole('status')).toHaveTextContent('No pudimos guardar la entrada.');
    expect(screen.getByLabelText('Entrada de la bitácora')).toHaveValue('Algo');
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  it('borra con confirmación en la misma línea; "No" cancela', async () => {
    writes.deleteNote.mockResolvedValue({ ok: true, data: undefined });
    renderLog();
    fireEvent.click(screen.getByRole('button', { name: 'Borrar entrada del 1 oct 2026 (Pedido)' }));
    expect(screen.getByText('¿Borrar?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'No' })).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'No' }));
    expect(screen.getByText('Zoom 360')).toBeInTheDocument();
    expect(writes.deleteNote).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /^Borrar entrada/ }));
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Sí, borrar' })));
    expect(writes.deleteNote).toHaveBeenCalledWith('n1');
    expect(screen.queryByText('Zoom 360')).not.toBeInTheDocument();
    expect(screen.getByText('Todavía no hay entradas en la bitácora.')).toBeInTheDocument();
    expect(screen.getByLabelText('Entrada de la bitácora')).toHaveFocus();
  });

  it('Pedido va en outline, no en coral', () => {
    renderLog();
    expect(screen.getByText('Pedido', { selector: 'span' })).toHaveClass('border-accent');
  });
});

describe('Eliminar', () => {
  beforeEach(() => vi.clearAllMocks());

  async function openDialog() {
    await renderProject('plv');
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    return screen.getByRole('dialog', { name: '¿Eliminar (F) Polera Studio · E-commerce?' });
  }

  it('Cancelar cierra sin tocar nada', async () => {
    const dialog = await openDialog();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(writes.deleteProject).not.toHaveBeenCalled();
  });

  it('Eliminar borra y lleva a la lista', async () => {
    writes.deleteProject.mockResolvedValue({ ok: true, data: undefined });
    const dialog = await openDialog();
    await act(async () =>
      fireEvent.click(within(dialog).getByRole('button', { name: 'Eliminar' })),
    );
    expect(writes.deleteProject).toHaveBeenCalledWith('plv');
    expect(writes.push).toHaveBeenCalledWith('/proyectos');
    expect(screen.getByRole('status')).toHaveTextContent('Proyecto eliminado');
  });

  it('Archivar lo archiva y refresca la ficha', async () => {
    writes.archiveProject.mockResolvedValue({ ok: true, data: undefined });
    const dialog = await openDialog();
    await act(async () =>
      fireEvent.click(within(dialog).getByRole('button', { name: 'Archivar' })),
    );
    expect(writes.archiveProject).toHaveBeenCalledWith('plv');
    expect(writes.refresh).toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('Proyecto archivado');
  });

  it('si falla, avisa y el diálogo sigue abierto', async () => {
    writes.deleteProject.mockResolvedValue({
      ok: false,
      error: 'No pudimos eliminar el proyecto.',
    });
    const dialog = await openDialog();
    await act(async () =>
      fireEvent.click(within(dialog).getByRole('button', { name: 'Eliminar' })),
    );
    expect(screen.getByRole('status')).toHaveTextContent('No pudimos eliminar el proyecto.');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(writes.push).not.toHaveBeenCalled();
  });
});
