import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ActionFeedbackProvider } from '@/components/ActionFeedback';
import { NoteLog } from '@/components/projects/detail/NoteLog';
import { PaymentsPanel, type PaymentsPanelProps } from '@/components/projects/detail/PaymentsPanel';
import type { ActionResult } from '@/lib/action-result';
import type { Note, Payment } from '@/lib/projects';
import { paymentInputSchema } from '@/lib/schemas';

const writes = vi.hoisted(() => ({
  addPayment: vi.fn(),
  deletePayment: vi.fn(),
  addNote: vi.fn(),
  deleteNote: vi.fn(),
}));
vi.mock('@/app/(app)/proyectos/[id]/actions', () => writes);
vi.mock('@/app/(auth)/login/actions', () => ({ signInWithGoogle: vi.fn() }));

const PROJECT = '6f1d2c3b-4a5e-4f60-8a7b-9c0d1e2f3a4b';

/** Promesa que el test resuelve cuando quiere: deja ver el estado optimista. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

const ADVANCE: Payment = {
  id: 'p1',
  amountPen: 3900,
  paidOn: '2026-09-15',
  concept: 'Adelanto 50%',
};

function renderPanel(props: Partial<PaymentsPanelProps> = {}) {
  return render(
    <ActionFeedbackProvider>
      <PaymentsPanel
        projectId={PROJECT}
        budgetPen={7800}
        initialPayments={[ADVANCE]}
        today="2026-10-05"
        {...props}
      />
    </ActionFeedbackProvider>,
  );
}

// textContent conserva el espacio duro de Intl (U+00A0): se normaliza (gotcha T09b).
const figure = (label: string) =>
  screen.getByText(label).nextElementSibling?.textContent?.replace(/\u00a0/g, ' ');
const list = () => within(screen.getByRole('list'));

function fillAndSubmit(amount: string, concept = 'Segundo pago') {
  fireEvent.change(screen.getByLabelText('Monto (S/)'), { target: { value: amount } });
  fireEvent.change(screen.getByLabelText('Concepto (opcional)'), { target: { value: concept } });
  fireEvent.click(screen.getByRole('button', { name: 'Registrar pago' }));
}

beforeEach(() => Object.values(writes).forEach((fn) => fn.mockReset()));

describe('paymentInputSchema', () => {
  const parse = (values: Record<string, string>) =>
    paymentInputSchema.safeParse({
      projectId: PROJECT,
      amountPen: '100',
      paidOn: '2026-10-01',
      concept: '',
      ...values,
    });

  it('acepta el formato del formulario y deja el concepto vacío en null', () => {
    const result = parse({ amountPen: '1,500.50' });
    expect(result.data).toMatchObject({ amountPen: 1500.5, concept: null });
  });

  it.each([
    [{ amountPen: '' }, 'Escribe el monto.'],
    [{ amountPen: '0' }, 'El monto debe ser mayor que 0.'],
    [{ amountPen: '12,5,0.999' }, 'Monto inválido (ej. 7800 o 7800.50).'],
    [{ paidOn: '2026-02-30' }, 'Elige la fecha del pago.'],
    [{ paidOn: '2999-01-01' }, 'La fecha no puede ser futura.'],
  ])('%o → "%s"', (values, message) => {
    expect(parse(values).error?.issues[0]?.message).toBe(message);
  });
});

describe('PaymentsPanel', () => {
  it('muestra cifras, barra y la lista con su botón de borrar', () => {
    renderPanel();
    expect(figure('Pagado')).toBe('S/ 3,900.00');
    expect(figure('Saldo')).toBe('S/ 3,900.00');
    expect(screen.getByRole('progressbar', { name: 'Cobrado' })).toHaveAttribute(
      'aria-valuenow',
      '50',
    );
    expect(screen.getByLabelText('Fecha')).toHaveValue('2026-10-05');
    expect(screen.getByLabelText('Fecha')).toHaveAttribute('max', '2026-10-05');
    expect(
      screen.getByRole('button', {
        name: /^Borrar pago del 15 set 2026 \(Adelanto 50%, S\/\s3,900\.00\)$/,
      }),
    ).toBeInTheDocument();
  });

  it('sin monto total no hay formulario ni lista', () => {
    renderPanel({ budgetPen: null, initialPayments: [] });
    expect(screen.getByText('Registra el monto desde Editar.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Registrar pago' })).not.toBeInTheDocument();
  });

  it('el pago aparece al instante (pendiente) y las cifras se recalculan antes de la respuesta', async () => {
    const server = deferred<ActionResult<Payment>>();
    writes.addPayment.mockReturnValue(server.promise);
    renderPanel();
    fillAndSubmit('1500');

    const row = await waitFor(() => list().getByText('Segundo pago').closest('li')!);
    expect(row).toHaveClass('opacity-60');
    expect(row).toHaveAttribute('aria-busy', 'true');
    expect(row).toHaveTextContent('Segundo pago (guardando…)');
    expect(figure('Pagado')).toBe('S/ 5,400.00');
    expect(writes.addPayment).toHaveBeenCalledWith({
      projectId: PROJECT,
      amountPen: 1500,
      paidOn: '2026-10-05',
      concept: 'Segundo pago',
    });

    await act(async () =>
      server.resolve({
        ok: true,
        data: { id: 'p2', amountPen: 1500, paidOn: '2026-10-05', concept: 'Segundo pago' },
      }),
    );
    const saved = list().getByText('Segundo pago').closest('li')!;
    expect(saved).not.toHaveClass('opacity-60');
    expect(list().getAllByRole('listitem')).toHaveLength(2);
    expect(figure('Pagado')).toBe('S/ 5,400.00');
    expect(screen.getByLabelText('Monto (S/)')).toHaveValue('');
    expect(screen.getByText('Pago registrado')).toBeInTheDocument();
  });

  it('si el servidor lo rechaza, el pago se va, las cifras vuelven y el error queda en el campo', async () => {
    const server = deferred<ActionResult<Payment>>();
    writes.addPayment.mockReturnValue(server.promise);
    renderPanel();
    fillAndSubmit('3000');
    await waitFor(() => expect(figure('Pagado')).toBe('S/ 6,900.00'));

    const message = 'El pago supera el saldo (S/ 900.00).';
    await act(async () =>
      server.resolve({ ok: false, error: message, fieldErrors: { amountPen: message } }),
    );
    expect(list().queryByText('Segundo pago')).not.toBeInTheDocument();
    expect(figure('Pagado')).toBe('S/ 3,900.00');
    expect(screen.getByLabelText('Monto (S/)')).toHaveValue('3000');
    expect(screen.getByLabelText('Monto (S/)')).toHaveAccessibleDescription(message);
  });

  it('con datos inválidos no llama al servidor', () => {
    renderPanel();
    fillAndSubmit('');
    expect(screen.getByLabelText('Monto (S/)')).toHaveAccessibleDescription('Escribe el monto.');
    expect(writes.addPayment).not.toHaveBeenCalled();
  });

  it('borrar pide confirmación; el pago se va al instante y vuelve si falla', async () => {
    const server = deferred<ActionResult>();
    writes.deletePayment.mockReturnValue(server.promise);
    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: /^Borrar pago del/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Sí, borrar' }));

    await waitFor(() =>
      expect(screen.getByText('Aún no hay pagos registrados.')).toBeInTheDocument(),
    );
    expect(figure('Pagado')).toBe('S/ 0.00');
    expect(writes.deletePayment).toHaveBeenCalledWith('p1');

    await act(async () => server.resolve({ ok: false, error: 'No pudimos borrar el pago.' }));
    expect(list().getByText('Adelanto 50%')).toBeInTheDocument();
    expect(figure('Pagado')).toBe('S/ 3,900.00');
    expect(screen.getByText('No pudimos borrar el pago.')).toBeInTheDocument();
  });
});

describe('NoteLog optimista', () => {
  const NOTE: Note = { id: 'n1', kind: 'nota', body: 'Primera reunión', notedOn: '2026-10-01' };

  function renderLog() {
    return render(
      <ActionFeedbackProvider>
        <NoteLog projectId={PROJECT} initialNotes={[NOTE]} />
      </ActionFeedbackProvider>,
    );
  }

  function write(body: string) {
    fireEvent.change(screen.getByRole('textbox', { name: 'Entrada de la bitácora' }), {
      target: { value: body },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Agregar a la bitácora' }));
  }

  it('la entrada aparece arriba al instante y se confirma con la respuesta', async () => {
    const server = deferred<ActionResult<Note>>();
    writes.addNote.mockReturnValue(server.promise);
    renderLog();
    write('Cambió el logo');

    const pending = await waitFor(() =>
      within(screen.getByRole('list'))
        .getByText(/Cambió el logo/)
        .closest('li')!,
    );
    expect(pending).toHaveClass('opacity-60');
    expect(screen.getAllByRole('listitem')[0]).toBe(pending);

    await act(async () =>
      server.resolve({
        ok: true,
        data: { id: 'n2', kind: 'pedido', body: 'Cambió el logo', notedOn: '2026-10-05' },
      }),
    );
    expect(
      within(screen.getByRole('list')).getByText('Cambió el logo').closest('li'),
    ).not.toHaveClass('opacity-60');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByRole('textbox', { name: 'Entrada de la bitácora' })).toHaveValue('');
  });

  it('si falla, la entrada se va pero el texto sigue en el campo', async () => {
    const server = deferred<ActionResult<Note>>();
    writes.addNote.mockReturnValue(server.promise);
    renderLog();
    write('Cambió el logo');
    await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(2));

    await act(async () => server.resolve({ ok: false, error: 'No pudimos guardar la entrada.' }));
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByRole('textbox', { name: 'Entrada de la bitácora' })).toHaveValue(
      'Cambió el logo',
    );
    expect(screen.getByText('No pudimos guardar la entrada.')).toBeInTheDocument();
  });
});
