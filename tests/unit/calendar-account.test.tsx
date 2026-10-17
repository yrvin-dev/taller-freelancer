import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import CalendarPage from '@/app/(app)/calendario/page';
import { savePreferences } from '@/app/(app)/cuenta/actions';
import { GET as exportData } from '@/app/(app)/cuenta/exportar/route';
import AccountPage from '@/app/(app)/cuenta/page';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { formatMonthYear, formatWeekdayShort } from '@/lib/format';
import { mockProjects } from '@/lib/mock/projects';
import { agendaEvents } from '@/lib/summary';

const TODAY = new Date(2026, 9, 5);

function withProviders(ui: React.ReactNode) {
  return render(
    <ThemeProvider initialTheme="light">
      <ToastProvider>{ui}</ToastProvider>
    </ThemeProvider>,
  );
}

describe('formatos de calendario', () => {
  it('mes y año en minúscula (o capitalizado) y día de la semana sin punto', () => {
    expect(formatMonthYear('2026-10-05')).toBe('octubre 2026');
    expect(formatMonthYear('2026-03-01', { capitalize: true })).toBe('Marzo 2026');
    expect(formatWeekdayShort('2026-10-05')).toBe('lun');
    expect(formatWeekdayShort('2026-10-07')).toBe('mié');
  });
});

describe('agendaEvents', () => {
  const months = agendaEvents(mockProjects(TODAY), TODAY);
  const all = months.flatMap((m) => m.events);

  it('agrupa por mes en orden, desde hoy', () => {
    // Sin horizonte, como el export: el dominio de Polera vence a 128 días (febrero).
    expect(months.map((m) => m.label)).toEqual([
      'Octubre 2026',
      'Noviembre 2026',
      'Diciembre 2026',
      'Febrero 2027',
    ]);
    const dates = all.map((e) => e.date);
    expect(dates).toEqual([...dates].sort());
    expect(dates.every((d) => d >= '2026-10-05')).toBe(true);
  });

  it('incluye entregas y vencimientos con su detalle, día y tono', () => {
    expect(all.map((e) => `${e.projectId}:${e.kind}:${e.day}`)).toEqual([
      'plv:entrega:12',
      'plv:hosting:19',
      'snd:dominio:28',
      'snd:hosting:15',
      'snd:entrega:20',
      'alq:entrega:01',
      'plv:dominio:10',
    ]);
    const plvEntrega = all[0]!;
    expect(plvEntrega).toMatchObject({
      detail: 'Entrega · Polera Studio',
      tone: 'accent',
      weekday: 'lun',
    });
    expect(all.find((e) => e.id === 'snd-dominio')).toMatchObject({
      detail: 'Dominio sonrident-citas.vercel.app',
      tone: 'neutral', // a 23 días
    });
  });

  it('un vencimiento a 7 días o menos va en coral; archivados y pasados no entran', () => {
    const later = new Date(2026, 9, 13); // plv hosting a 6 días; plv entrega ya pasó
    const events = agendaEvents(mockProjects(TODAY), later).flatMap((m) => m.events);
    expect(events.find((e) => e.id === 'plv-hosting')?.tone).toBe('accent-2');
    expect(events.find((e) => e.id === 'plv-entrega')).toBeUndefined();

    const archived = mockProjects(TODAY).map((p) => ({ ...p, status: 'archivado' as const }));
    expect(agendaEvents(archived, TODAY)).toEqual([]);
  });
});

describe('/calendario', () => {
  it('lista los eventos por mes y enlaza a la ficha', () => {
    withProviders(<CalendarPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Calendario' })).toBeInTheDocument();
    const firstMonth = screen.getAllByRole('region')[0]!;
    const firstEvent = within(firstMonth).getAllByRole('link')[0]!;
    expect(firstEvent.getAttribute('href')).toMatch(/^\/proyectos\/\w+$/);
  });
});

describe('/cuenta', () => {
  it('muestra perfil, preferencias y tus datos', () => {
    withProviders(<AccountPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Cuenta' })).toBeInTheDocument();
    expect(screen.getByText('Miembro desde marzo 2026')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Exportar datos/ })).toHaveAttribute(
      'href',
      '/cuenta/exportar',
    );
    expect(screen.getByLabelText('Nombre para el saludo')).toHaveValue('Yrvin');
  });

  it('el Seg de tema cambia el tema de verdad', () => {
    document.documentElement.dataset.theme = 'light';
    withProviders(<AccountPage />);
    fireEvent.click(screen.getByRole('radio', { name: 'Oscuro' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('guarda una preferencia al salir del campo y valida', async () => {
    withProviders(<AccountPage />);
    const name = screen.getByLabelText('Nombre para el saludo');

    fireEvent.change(name, { target: { value: '   ' } });
    await act(async () => fireEvent.blur(name));
    expect(name).toHaveAccessibleDescription('Escribe cómo quieres que te saludemos.');

    fireEvent.change(name, { target: { value: 'Yrvin H.' } });
    await act(async () => fireEvent.blur(name));
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
        'Se guardará al conectar la base de datos',
      ),
    );
    expect(name).not.toHaveAttribute('aria-invalid');
  });

  it('borrar cuenta pide confirmación', () => {
    withProviders(<AccountPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Borrar cuenta' }));
    const dialog = screen.getByRole('dialog', { name: '¿Borrar tu cuenta?' });
    expect(dialog).toHaveTextContent('Se eliminarán 6 proyectos');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('savePreferences (Server Action)', () => {
  it('valida con preferencesSchema', async () => {
    await expect(savePreferences({ displayName: '', basePath: '' })).resolves.toMatchObject({
      ok: false,
      fieldErrors: { displayName: 'Escribe cómo quieres que te saludemos.' },
    });
    await expect(
      savePreferences({ displayName: 'Yrvin', basePath: 'D:\\Proyectos' }),
    ).resolves.toEqual({
      ok: true,
      data: { persisted: false },
    });
  });
});

describe('GET /cuenta/exportar', () => {
  it('descarga un JSON sin credenciales ni secretos', async () => {
    const response = exportData();
    expect(response.headers.get('Content-Type')).toBe('application/json; charset=utf-8');
    expect(response.headers.get('Content-Disposition')).toMatch(
      /^attachment; filename="taller-freelancer-\d{4}-\d{2}-\d{2}\.json"$/,
    );
    expect(response.headers.get('Cache-Control')).toBe('no-store');

    const text = await response.text();
    const data = JSON.parse(text) as { proyectos: Record<string, unknown>[] };
    expect(data.proyectos).toHaveLength(6);
    expect(data.proyectos.every((p) => !('credentials' in p))).toBe(true);
    // Ni secretos ni las etiquetas de credenciales ("Medusa Admin" también es un CMS,
    // así que se comprueba la ausencia de la clave y de cualquier secreto).
    expect(text).not.toContain('demo-');
    expect(text).not.toContain('"credentials"');
    expect(data.proyectos[0]).toHaveProperty('payments');
  });
});
