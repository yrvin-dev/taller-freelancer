import { mockProjects } from '@/lib/mock/projects';
import { paidPen, type Project } from '@/lib/projects';
import {
  expiringSoon,
  expiryTone,
  homeSummaryLine,
  pendingPayments,
  recentProjects,
  totalBalance,
  upcomingDeliveries,
} from '@/lib/summary';

const TODAY = new Date(2026, 9, 5, 15, 0); // 5 oct 2026, 15:00 (la hora no debe influir)

function project(overrides: Partial<Project>): Project {
  return {
    id: 'x',
    code: 'X-1',
    name: 'Proyecto',
    client: 'Cliente',
    clientContact: null,
    clientEmail: null,
    clientWhatsapp: null,
    clientCountry: null,
    type: 'landing',
    status: 'en_desarrollo',
    isDemo: false,
    description: null,
    deliveryDate: null,
    stack: { frontend: [], backend: [], db: [], hosting: [] },
    cms: null,
    localPath: null,
    links: {},
    domainName: null,
    domainExpires: null,
    domainPending: false,
    hostingExpires: null,
    budgetPen: null,
    thumbnailUrl: null,
    updatedAt: '2026-10-01T00:00:00.000Z',
    payments: [],
    ...overrides,
  };
}

describe('upcomingDeliveries', () => {
  it('incluye hoy y el futuro, ordenado por cercanía', () => {
    const result = upcomingDeliveries(
      [
        project({ id: 'lejos', deliveryDate: '2026-11-01' }),
        project({ id: 'hoy', deliveryDate: '2026-10-05' }),
        project({ id: 'pasada', deliveryDate: '2026-10-04' }),
        project({ id: 'sin-fecha' }),
      ],
      TODAY,
    );
    expect(result.map((r) => [r.project.id, r.days])).toEqual([
      ['hoy', 0],
      ['lejos', 27],
    ]);
  });

  it('excluye Producción y Archivado', () => {
    const result = upcomingDeliveries(
      [
        project({ id: 'prod', status: 'produccion', deliveryDate: '2026-10-10' }),
        project({ id: 'arch', status: 'archivado', deliveryDate: '2026-10-10' }),
        project({ id: 'rev', status: 'revision', deliveryDate: '2026-10-10' }),
      ],
      TODAY,
    );
    expect(result.map((r) => r.project.id)).toEqual(['rev']);
  });
});

describe('expiringSoon', () => {
  it('toma dominio y hosting entre 0 y 30 días, y pone primero los dominios por comprar', () => {
    const result = expiringSoon(
      [
        project({ id: 'a', domainExpires: '2026-11-04', hostingExpires: '2026-11-05' }), // 30 y 31
        project({ id: 'b', hostingExpires: '2026-10-08' }), // 3
        project({ id: 'c', domainExpires: '2026-10-01' }), // ya vencido: fuera
        project({ id: 'd', domainPending: true }),
        project({
          id: 'e',
          status: 'archivado',
          domainPending: true,
          hostingExpires: '2026-10-06',
        }),
      ],
      TODAY,
    );
    expect(
      result.map((e) =>
        e.pending ? `${e.project.id}:comprar` : `${e.project.id}:${e.kind}:${e.days}`,
      ),
    ).toEqual(['d:comprar', 'b:hosting:3', 'a:dominio:30']);
  });

  it('el badge es coral si faltan 7 días o menos, o si hay que comprar', () => {
    const p = project({});
    expect(expiryTone({ project: p, kind: 'dominio', pending: true })).toBe('accent-2');
    expect(expiryTone({ project: p, kind: 'hosting', pending: false, days: 7 })).toBe('accent-2');
    expect(expiryTone({ project: p, kind: 'hosting', pending: false, days: 8 })).toBe('neutral');
  });
});

describe('pendingPayments', () => {
  it('calcula el saldo con céntimos exactos y omite lo pagado, sin presupuesto o archivado', () => {
    const result = pendingPayments([
      project({
        id: 'debe',
        budgetPen: 1000.3,
        payments: [
          { id: '1', amountPen: 0.1, paidOn: '2026-09-01' },
          { id: '2', amountPen: 0.2, paidOn: '2026-09-02' },
        ],
      }),
      project({
        id: 'pagado',
        budgetPen: 500,
        payments: [{ id: '3', amountPen: 500, paidOn: '2026-09-03' }],
      }),
      project({ id: 'sin-presupuesto' }),
      project({ id: 'archivado', status: 'archivado', budgetPen: 800 }),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ budget: 1000.3, paid: 0.3, balance: 1000 });
    expect(totalBalance(result)).toBe(1000);
  });

  it('paidPen suma sin errores de coma flotante', () => {
    expect(
      paidPen({
        payments: [
          { id: '1', amountPen: 0.1, paidOn: '' },
          { id: '2', amountPen: 0.2, paidOn: '' },
        ],
      }),
    ).toBe(0.3);
  });
});

describe('homeSummaryLine', () => {
  it('pluraliza bien', () => {
    expect(homeSummaryLine([project({ domainPending: true, budgetPen: 100 })])).toBe(
      '1 proyecto en desarrollo · 1 dominio por comprar · 1 saldo por cobrar.',
    );
    expect(homeSummaryLine([])).toBe(
      '0 proyectos en desarrollo · 0 dominios por comprar · 0 saldos por cobrar.',
    );
  });
});

describe('mockProjects (datos del export)', () => {
  const projects = mockProjects(TODAY);

  it('reproduce el panel del export con fechas relativas a hoy', () => {
    expect(upcomingDeliveries(projects, TODAY).map((d) => [d.project.code, d.days])).toEqual([
      ['PLV-2026', 7],
      ['SND-2026', 46],
      ['ALQ-2026', 57],
    ]);
    expect(
      expiringSoon(projects, TODAY).map((e) =>
        e.pending ? `${e.project.code}:comprar` : `${e.project.code}:${e.kind}:${e.days}`,
      ),
    ).toEqual([
      'AGB-2026:comprar',
      'AGW-2026:comprar',
      'PLV-2026:hosting:14',
      'SND-2026:dominio:23',
    ]);

    const owing = pendingPayments(projects);
    expect(owing.map((p) => [p.project.code, p.balance])).toEqual([
      ['SND-2026', 5700],
      ['PLV-2026', 3900],
      ['ALQ-2026', 4500],
    ]);
    expect(totalBalance(owing)).toBe(14100);
    expect(homeSummaryLine(projects)).toBe(
      '4 proyectos en desarrollo · 2 dominios por comprar · 3 saldos por cobrar.',
    );
  });

  it('los recientes salen en el orden del export', () => {
    expect(recentProjects(projects).map((p) => p.code)).toEqual([
      'SND-2026',
      'AGB-2026',
      'AGW-2026',
      'DFL-2026',
    ]);
  });

  it('con otro "hoy" los badges cambian solos (no están escritos a mano)', () => {
    const later = new Date(2026, 9, 9);
    const fromLater = mockProjects(TODAY);
    expect(upcomingDeliveries(fromLater, later)[0]).toMatchObject({ days: 3 });
  });
});
