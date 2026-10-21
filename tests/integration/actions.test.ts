import { randomUUID } from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import { autoCode } from '@/lib/data/project-mapper';
import { EMPTY_PROJECT_FORM } from '@/lib/project-form';
import type { ProjectFormValues } from '@/lib/schemas';

// Server Actions de T16b contra la base real: Zod, RLS, FK compuestas, cascadas y
// triggers corren de verdad. Lo único simulado es de dónde sale el cliente de
// Supabase (en la app, de las cookies; aquí, de un usuario de prueba con sesión).

const url = process.env.SUPABASE_TEST_URL!;
const anonKey = process.env.SUPABASE_TEST_ANON_KEY!;
const admin = createClient<Database>(url, process.env.SUPABASE_TEST_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

const session = vi.hoisted(() => ({ client: null as unknown }));
vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: async () => session.client,
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const { saveProject } = await import('@/app/(app)/proyectos/actions');
const { addNote, addPayment, archiveProject, deleteNote, deletePayment, deleteProject } =
  await import('@/app/(app)/proyectos/[id]/actions');

type User = { id: string; client: SupabaseClient<Database> };
const createdUsers: string[] = [];

async function newUser(): Promise<User> {
  const email = `actions-${randomUUID()}@rls.test`;
  const password = `pw-${randomUUID()}`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error('Sin usuario');
  createdUsers.push(data.user.id);
  const client = createClient<Database>(url, anonKey, { auth: { persistSession: false } });
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;
  return { id: data.user.id, client };
}

const as = (user: User) => {
  session.client = user.client;
};
const form = (values: Partial<ProjectFormValues>): ProjectFormValues => ({
  ...EMPTY_PROJECT_FORM,
  ...values,
});

let a: User;
let b: User;
const year = new Date().getFullYear();

beforeAll(async () => {
  a = await newUser();
  b = await newUser();
});

afterAll(async () => {
  for (const id of createdUsers) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) throw error;
  }
});

describe('saveProject', () => {
  it('crea el proyecto con su adelanto y su primera nota', async () => {
    as(a);
    const result = await saveProject(
      form({
        name: 'Polera Studio',
        client: 'Polera',
        code: 'plv-2026',
        type: 'ecommerce',
        frontend: 'Next.js, Tailwind',
        budgetPen: '7800',
        advancePen: '3900',
        firstNote: 'Pedido inicial',
      }),
    );
    expect(result.ok).toBe(true);
    const id = result.ok ? result.data.id : '';

    const { data } = await admin
      .from('projects')
      .select(
        'owner_id, code, stack_frontend, budget_pen, payments(amount_pen, concept), notes(kind, body)',
      )
      .eq('id', id)
      .single();
    expect(data).toMatchObject({
      owner_id: a.id,
      code: 'PLV-2026',
      stack_frontend: ['Next.js', 'Tailwind'],
      budget_pen: 7800,
      payments: [{ amount_pen: 3900, concept: 'Adelanto' }],
      notes: [{ kind: 'nota', body: 'Pedido inicial' }],
    });
  });

  it('sin código genera uno, y si se repite le agrega un sufijo', async () => {
    as(a);
    const first = await saveProject(form({ name: 'Colegio Brown', client: 'Colegio' }));
    const second = await saveProject(form({ name: 'Colegio Brown', client: 'Colegio' }));
    const codes = await admin
      .from('projects')
      .select('code')
      .in('id', [first.ok ? first.data.id : '', second.ok ? second.data.id : '']);
    expect(codes.data?.map((r) => r.code).sort()).toEqual([
      autoCode('Colegio Brown', year),
      `${autoCode('Colegio Brown', year)}-2`,
    ]);
  });

  it('un código escrito que ya existe vuelve como error del campo', async () => {
    as(a);
    const result = await saveProject(form({ name: 'Otro', client: 'X', code: 'PLV-2026' }));
    expect(result).toEqual({
      ok: false,
      error: 'Revisa los campos marcados.',
      fieldErrors: { code: 'Ya tienes un proyecto con ese código.' },
    });
  });

  it('el mismo código en otra cuenta no choca (es único por dueño)', async () => {
    as(b);
    const result = await saveProject(form({ name: 'De B', client: 'X', code: 'PLV-2026' }));
    expect(result.ok).toBe(true);
  });

  it('actualiza un proyecto propio y no uno ajeno', async () => {
    as(a);
    const created = await saveProject(form({ name: 'Para editar', client: 'X', code: 'EDT-1' }));
    const id = created.ok ? created.data.id : '';

    const own = await saveProject(
      form({ name: 'Editado', client: 'X', code: 'EDT-1', status: 'revision' }),
      id,
    );
    expect(own).toEqual({ ok: true, data: { id } });

    as(b);
    const foreign = await saveProject(form({ name: 'Hackeado', client: 'X', code: 'EDT-1' }), id);
    expect(foreign).toEqual({ ok: false, error: 'No encontramos ese proyecto.' });

    const { data } = await admin.from('projects').select('name, status').eq('id', id).single();
    expect(data).toEqual({ name: 'Editado', status: 'revision' });
  });

  it('datos inválidos no llegan a la base', async () => {
    as(a);
    const before = await admin
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', a.id);
    const result = await saveProject(
      form({ name: '', client: 'X', linkRepo: 'javascript:alert(1)' }),
    );
    expect(result.ok).toBe(false);
    const after = await admin
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', a.id);
    expect(after.count).toBe(before.count);
  });
});

describe('notas', () => {
  let projectId: string;

  beforeAll(async () => {
    as(a);
    const created = await saveProject(form({ name: 'Con bitácora', client: 'X', code: 'NOT-1' }));
    projectId = created.ok ? created.data.id : '';
  });

  it('agrega y borra una nota propia', async () => {
    as(a);
    const added = await addNote({ projectId, kind: 'pedido', body: '  Zoom 360  ' });
    expect(added).toMatchObject({ ok: true, data: { kind: 'pedido', body: 'Zoom 360' } });
    const noteId = added.ok ? added.data.id : '';
    await expect(deleteNote(noteId)).resolves.toEqual({ ok: true, data: undefined });
    const { data } = await admin.from('notes').select('id').eq('id', noteId);
    expect(data).toEqual([]);
  });

  it('no puede agregar ni borrar notas en un proyecto ajeno', async () => {
    as(a);
    const added = await addNote({ projectId, kind: 'nota', body: 'De A' });
    const noteId = added.ok ? added.data.id : '';

    as(b);
    await expect(addNote({ projectId, kind: 'nota', body: 'Intruso' })).resolves.toMatchObject({
      ok: false,
    });
    await expect(deleteNote(noteId)).resolves.toMatchObject({ ok: false });
    const { data } = await admin.from('notes').select('id').eq('id', noteId);
    expect(data).toHaveLength(1);
  });

  it('valida la entrada con Zod', async () => {
    as(a);
    await expect(addNote({ projectId, kind: 'chisme', body: 'x' })).resolves.toMatchObject({
      ok: false,
    });
    await expect(addNote({ projectId: 'no-uuid', kind: 'nota', body: 'x' })).resolves.toMatchObject(
      { ok: false },
    );
  });
});

describe('archivar y eliminar', () => {
  it('archiva y elimina lo propio (con cascada), no lo ajeno', async () => {
    as(a);
    const created = await saveProject(
      form({
        name: 'Para borrar',
        client: 'X',
        code: 'DEL-1',
        budgetPen: '100',
        advancePen: '50',
        firstNote: 'x',
      }),
    );
    const id = created.ok ? created.data.id : '';

    as(b);
    await expect(archiveProject(id)).resolves.toMatchObject({ ok: false });
    await expect(deleteProject(id)).resolves.toMatchObject({ ok: false });

    as(a);
    await expect(archiveProject(id)).resolves.toEqual({ ok: true, data: undefined });
    const archived = await admin.from('projects').select('status').eq('id', id).single();
    expect(archived.data?.status).toBe('archivado');

    await expect(deleteProject(id)).resolves.toEqual({ ok: true, data: undefined });
    const left = await Promise.all([
      admin.from('projects').select('id').eq('id', id),
      admin.from('payments').select('id').eq('project_id', id),
      admin.from('notes').select('id').eq('project_id', id),
    ]);
    expect(left.map((r) => r.data)).toEqual([[], [], []]);
  });
});

describe('pagos', () => {
  let projectId: string;
  let noBudgetId: string;
  const pay = (amountPen: string, paidOn = '2026-01-15') =>
    addPayment({ projectId, amountPen, paidOn, concept: 'Pago' });

  beforeAll(async () => {
    as(a);
    const withBudget = await saveProject(
      form({ name: 'Con pagos', client: 'X', code: 'PAG-1', budgetPen: '1000' }),
    );
    const withoutBudget = await saveProject(
      form({ name: 'Sin monto', client: 'X', code: 'PAG-2' }),
    );
    projectId = withBudget.ok ? withBudget.data.id : '';
    noBudgetId = withoutBudget.ok ? withoutBudget.data.id : '';
  });

  it('registra un pago propio y lo devuelve como dominio', async () => {
    as(a);
    const result = await pay('400.50');
    expect(result).toMatchObject({ ok: true, data: { amountPen: 400.5, paidOn: '2026-01-15' } });
    const { data } = await admin.from('payments').select('amount_pen').eq('project_id', projectId);
    expect(data!.map((r) => Number(r.amount_pen))).toEqual([400.5]);
  });

  it('no deja superar el saldo (lo revisa contra la base)', async () => {
    as(a);
    const result = await pay('600');
    expect(result.ok).toBe(false);
    expect(result.ok ? '' : result.fieldErrors?.amountPen).toMatch(
      /^El pago supera el saldo \(S\/\s599\.50\)\.$/,
    );
    // Justo el saldo sí entra.
    await expect(pay('599.50')).resolves.toMatchObject({ ok: true });
  });

  it('sin monto total no se registran pagos', async () => {
    as(a);
    await expect(
      addPayment({ projectId: noBudgetId, amountPen: '10', paidOn: '2026-01-15', concept: '' }),
    ).resolves.toEqual({ ok: false, error: 'Registra primero el monto total desde Editar.' });
  });

  it('valida con Zod: monto, fecha futura y fecha inválida', async () => {
    as(a);
    const future = await pay('1', '2999-01-01');
    expect(future.ok ? null : future.fieldErrors).toEqual({
      paidOn: 'La fecha no puede ser futura.',
    });
    const bad = await pay('0', '2026-02-30');
    expect(bad.ok ? null : bad.fieldErrors).toEqual({
      amountPen: 'El monto debe ser mayor que 0.',
      paidOn: 'Elige la fecha del pago.',
    });
  });

  it('no puede registrar ni borrar pagos en un proyecto ajeno', async () => {
    as(a);
    const { data } = await admin.from('payments').select('id').eq('project_id', projectId).limit(1);
    const paymentId = data![0]!.id;

    as(b);
    await expect(pay('1')).resolves.toEqual({ ok: false, error: 'No encontramos ese proyecto.' });
    await expect(deletePayment(paymentId)).resolves.toMatchObject({ ok: false });
    const { data: still } = await admin.from('payments').select('id').eq('id', paymentId);
    expect(still).toHaveLength(1);
  });

  it('borra un pago propio', async () => {
    as(a);
    const { data } = await admin.from('payments').select('id').eq('project_id', projectId);
    for (const { id } of data!) {
      await expect(deletePayment(id)).resolves.toEqual({ ok: true, data: undefined });
    }
    const { data: left } = await admin.from('payments').select('id').eq('project_id', projectId);
    expect(left).toEqual([]);
  });
});

describe('sin sesión (401)', () => {
  it('toda acción devuelve code: unauthorized y no escribe nada', async () => {
    // Cliente anónimo: como un navegador cuya sesión ya venció.
    session.client = createClient<Database>(url, anonKey, { auth: { persistSession: false } });
    const id = randomUUID();
    const results = await Promise.all([
      saveProject(form({ name: 'Sin sesión', client: 'X', code: 'EXP-1' })),
      addNote({ projectId: id, kind: 'nota', body: 'x' }),
      deleteNote(id),
      archiveProject(id),
      deleteProject(id),
      addPayment({ projectId: id, amountPen: '10', paidOn: '2026-01-01', concept: '' }),
      deletePayment(id),
    ]);
    for (const result of results) {
      expect(result).toEqual({
        ok: false,
        error: 'Tu sesión expiró. Vuelve a entrar.',
        code: 'unauthorized',
      });
    }
    const { data } = await admin.from('projects').select('id').eq('code', 'EXP-1');
    expect(data).toEqual([]);
  });
});
