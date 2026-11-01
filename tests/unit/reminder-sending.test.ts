// @vitest-environment node
import { sendEmail } from '@/lib/email';
import { buildTestReminderEmail } from '@/lib/reminder-email';
import type { DueReminder } from '@/lib/reminders';

// Envío de recordatorios (T30b): el cliente de Resend y la ruta de Vercel Cron. La
// tarea contra la base real está en tests/integration/reminders.test.ts.

const job = vi.hoisted(() => ({ run: vi.fn() }));
vi.mock('@/lib/reminder-job', () => ({ runReminderJob: job.run }));
vi.mock('@/lib/supabase/admin', () => ({ createSupabaseAdminClient: () => ({}) }));

const { GET } = await import('@/app/api/cron/recordatorios/route');

const EMAIL = { to: 'yo@ejemplo.com', subject: 'Asunto', html: '<p>Hola</p>', text: 'Hola' };

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  job.run.mockReset();
});

describe('sendEmail (Resend)', () => {
  beforeEach(() => {
    vi.stubEnv('RESEND_API_KEY', 're_prueba');
    vi.stubEnv('REMINDERS_FROM', 'Taller Freelancer <recordatorios@tallerfreelance.com>');
  });

  it('manda remitente, destinatario y la clave, con la clave de idempotencia', async () => {
    const fetchMock = vi.fn(async () => Response.json({ id: 'email_123' }));
    vi.stubGlobal('fetch', fetchMock);

    expect(await sendEmail(EMAIL, 'recordatorios-u1-2026-11-01')).toEqual({
      ok: true,
      id: 'email_123',
    });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.resend.com/emails');
    expect(init.headers).toMatchObject({
      Authorization: 'Bearer re_prueba',
      'Idempotency-Key': 'recordatorios-u1-2026-11-01',
    });
    expect(JSON.parse(init.body as string)).toEqual({
      from: 'Taller Freelancer <recordatorios@tallerfreelance.com>',
      ...EMAIL,
    });
  });

  it('si Resend rechaza el envío, no lanza: devuelve el error', async () => {
    vi.stubGlobal('fetch', async () =>
      Response.json({ message: 'dominio no verificado' }, { status: 403 }),
    );
    expect(await sendEmail(EMAIL)).toEqual({
      ok: false,
      error: 'Resend respondió 403: dominio no verificado',
    });
  });

  it('sin configuración, falla nombrando la variable', async () => {
    vi.stubEnv('RESEND_API_KEY', '');
    expect(await sendEmail(EMAIL)).toEqual({
      ok: false,
      error: 'Falta RESEND_API_KEY en el entorno del servidor.',
    });
  });
});

describe('GET /api/cron/recordatorios', () => {
  const call = (authorization?: string) =>
    GET(
      new Request('https://tallerfreelance.com/api/cron/recordatorios', {
        headers: authorization ? { authorization } : {},
      }),
    );

  beforeEach(() => {
    vi.stubEnv('CRON_SECRET', 'secreto-del-cron');
    vi.stubEnv('REMINDERS_FROM', 'Taller Freelancer <recordatorios@tallerfreelance.com>');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://tallerfreelance.com/');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://ejemplo.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
    job.run.mockResolvedValue({ users: 2, sent: 1, failed: 0 });
  });

  it('sin la clave correcta responde 401 y no corre la tarea', async () => {
    // (`Request` recorta los espacios de una cabecera: no sirve para probar `'… '`.)
    for (const header of [
      undefined,
      'Bearer otro',
      'secreto-del-cron',
      'bearer secreto-del-cron',
    ]) {
      expect((await call(header)).status).toBe(401);
    }
    expect(job.run).not.toHaveBeenCalled();
  });

  it('sin CRON_SECRET configurado, nadie puede correrla', async () => {
    vi.stubEnv('CRON_SECRET', '');
    expect((await call('Bearer ')).status).toBe(401);
    expect(job.run).not.toHaveBeenCalled();
  });

  it('con la clave, corre la tarea con la URL sin barra final y devuelve el resumen', async () => {
    const response = await call('Bearer secreto-del-cron');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ users: 2, sent: 1, failed: 0 });
    expect(job.run).toHaveBeenCalledWith(
      expect.objectContaining({ siteUrl: 'https://tallerfreelance.com' }),
    );
  });

  it('sin remitente configurado, no envía nada', async () => {
    vi.stubEnv('REMINDERS_FROM', '');
    const response = await call('Bearer secreto-del-cron');
    expect(await response.json()).toEqual({
      skipped: 'El envío de recordatorios no está configurado.',
    });
    expect(job.run).not.toHaveBeenCalled();
  });
});

describe('correo de prueba', () => {
  const reminder: DueReminder = {
    projectId: 'p1',
    projectName: 'Colegio Monteazul',
    kind: 'entrega',
    dueOn: '2026-11-03',
    days: 2,
  };
  const SITE = 'https://tallerfreelance.com';

  it('con avisos: el mismo correo, marcado como prueba', () => {
    const email = buildTestReminderEmail({
      name: 'Yrvin',
      reminders: [reminder],
      leadDays: 7,
      siteUrl: SITE,
    });
    expect(email.subject).toBe(
      '[Prueba] Entrega de Colegio Monteazul: se entrega el 3 nov 2026 (en 2 días)',
    );
    expect(email.text).toMatch(/^Este es un correo de prueba/);
    expect(email.html).toContain('<em>Este es un correo de prueba');
  });

  it('sin avisos: lo dice, en vez de inventar uno', () => {
    const email = buildTestReminderEmail({
      name: 'Yrvin',
      reminders: [],
      leadDays: 14,
      siteUrl: SITE,
    });
    expect(email.subject).toBe('[Prueba] Recordatorios de Taller Freelancer');
    expect(email.text).toContain('No tienes entregas ni vencimientos en los próximos 14 días');
  });
});
