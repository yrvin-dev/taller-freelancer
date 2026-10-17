import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { revealCredential } from '@/app/(app)/proyectos/[id]/actions';
import ProjectPage from '@/app/(app)/proyectos/[id]/page';
import { CredentialRow, REVEAL_MS } from '@/components/projects/detail/CredentialRow';
import { NoteLog } from '@/components/projects/detail/NoteLog';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ToastProvider } from '@/components/ui/Toast';

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
  function renderLog(
    notes = [{ id: 'n1', kind: 'pedido' as const, body: 'Zoom 360', notedOn: '2026-10-01' }],
  ) {
    return render(
      <ToastProvider>
        <NoteLog initialNotes={notes} today="2026-10-16" />
      </ToastProvider>,
    );
  }

  it('agrega una entrada arriba con la fecha de hoy', () => {
    renderLog();
    const add = screen.getByRole('button', { name: 'Agregar a la bitácora' });
    expect(add).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Tipo de entrada'), { target: { value: 'cambio' } });
    fireEvent.change(screen.getByLabelText('Entrada de la bitácora'), {
      target: { value: 'Checkout con Yape' },
    });
    fireEvent.click(add);
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('16 oct 2026');
    expect(items[0]).toHaveTextContent('Checkout con Yape');
    expect(within(items[0]!).getByText('Cambio')).toHaveClass('bg-accent-100');
    expect(screen.getByRole('status')).toHaveTextContent('Nota agregada');
  });

  it('borra con confirmación en la misma línea; "No" cancela', () => {
    renderLog();
    const borrar = screen.getByRole('button', { name: 'Borrar entrada del 1 oct 2026 (Pedido)' });
    fireEvent.click(borrar);
    expect(screen.getByText('¿Borrar?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'No' })).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'No' }));
    expect(screen.getByText('Zoom 360')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^Borrar entrada/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Sí, borrar' }));
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
  it('abre el diálogo con Archivar / Cancelar / Eliminar y avisa que falta la base', async () => {
    await renderProject('plv');
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    const dialog = screen.getByRole('dialog', {
      name: '¿Eliminar (F) Polera Studio · E-commerce?',
    });
    expect(within(dialog).getByRole('button', { name: 'Archivar' })).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Eliminar' }));
    expect(screen.getByRole('status')).toHaveTextContent('Disponible al conectar la base de datos');
  });
});
