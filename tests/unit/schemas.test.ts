import { saveProject } from '@/app/(app)/proyectos/actions';
import { mockProjects } from '@/lib/mock/projects';
import { EMPTY_PROJECT_FORM, toFormValues } from '@/lib/project-form';
import { isValidLink, projectSchema, type ProjectFormValues } from '@/lib/schemas';

const valid: ProjectFormValues = {
  ...EMPTY_PROJECT_FORM,
  name: '  Colegio AGB  ',
  client: 'Colegio Guillermo Brown',
};

function errorsFor(overrides: Partial<ProjectFormValues>): Record<string, string> {
  const result = projectSchema.safeParse({ ...valid, ...overrides });
  if (result.success) return {};
  return Object.fromEntries(result.error.issues.map((i) => [i.path.join('.'), i.message]));
}

describe('projectSchema: obligatorios y normalización', () => {
  it('acepta el mínimo y normaliza: trim, vacíos a null, listas', () => {
    const data = projectSchema.parse({
      ...valid,
      code: 'agb-2026',
      frontend: 'Astro,  Tailwind , , Astro',
      budgetPen: '7,800.50',
    });
    expect(data.name).toBe('Colegio AGB');
    expect(data.code).toBe('AGB-2026');
    expect(data.frontend).toEqual(['Astro', 'Tailwind']);
    expect(data.backend).toEqual([]);
    expect(data.description).toBeNull();
    expect(data.deliveryDate).toBeNull();
    expect(data.budgetPen).toBe(7800.5);
    expect(data.cms).toBeNull();
  });

  it('pide nombre y cliente con un mensaje por campo', () => {
    expect(errorsFor({ name: '   ', client: '' })).toMatchObject({
      name: 'Completa el nombre del proyecto.',
      client: 'Completa el cliente.',
    });
  });

  it('rechaza tipo y estado fuera del enum', () => {
    const errors = errorsFor({ type: 'blog' as never, status: 'pausado' as never });
    expect(errors.type).toBe('Elige un tipo.');
    expect(errors.status).toBe('Elige un estado.');
  });

  it('limita largos', () => {
    expect(errorsFor({ name: 'x'.repeat(121) }).name).toBe('Máximo 120 caracteres.');
  });
});

describe('projectSchema: formatos', () => {
  it.each([
    ['code', 'AGB 2026', 'Solo letras, números y guiones (ej. AGB-2026).'],
    ['deliveryDate', '2026-02-30', 'Fecha inválida.'],
    ['deliveryDate', '30/10/2026', 'Fecha inválida.'],
    ['clientEmail', 'andres@', 'Correo inválido.'],
    ['clientWhatsapp', '12345', 'Teléfono inválido (ej. +51 954 228 017).'],
    ['clientWhatsapp', '+51 954 abc', 'Teléfono inválido (ej. +51 954 228 017).'],
    ['budgetPen', '7.800,50', 'Monto inválido (ej. 7800 o 7800.50).'],
    ['budgetPen', '-100', 'Monto inválido (ej. 7800 o 7800.50).'],
    ['budgetPen', '10.555', 'Monto inválido (ej. 7800 o 7800.50).'],
  ] as const)('%s = %j → error', (field, value, message) => {
    expect(errorsFor({ [field]: value })[field]).toBe(message);
  });

  it('acepta formatos válidos', () => {
    expect(
      errorsFor({
        deliveryDate: '2026-11-20',
        clientEmail: 'admin@sonrident.pe',
        clientWhatsapp: '+51 954 228 017',
        budgetPen: '9500',
        cms: 'Medusa Admin',
      }),
    ).toEqual({});
  });

  it('"Sin CMS" se guarda como null', () => {
    expect(projectSchema.parse({ ...valid, cms: 'Sin CMS' }).cms).toBeNull();
  });
});

describe('enlaces', () => {
  it.each([
    ['polerastudio.pe', true],
    ['https://github.com/devfreelance/x', true],
    ['landing-colegio-agb.vercel.app/sanity', true],
    ['localhost', true],
    ['javascript:alert(1)', false],
    ['data:text/html,hola', false],
    ['no es un link', false],
    ['palabra', false],
  ] as const)('isValidLink(%j) → %s', (value, expected) => {
    expect(isValidLink(value)).toBe(expected);
  });

  it('el esquema rechaza un enlace javascript: con mensaje en el campo', () => {
    expect(errorsFor({ linkRepo: 'javascript:alert(1)' }).linkRepo).toBe(
      'Usa un enlace http(s) o un dominio (ej. polerastudio.pe).',
    );
  });
});

describe('pagos', () => {
  it('el adelanto no puede superar el total', () => {
    expect(errorsFor({ budgetPen: '1000', advancePen: '1500' }).advancePen).toBe(
      'El adelanto no puede superar el monto total.',
    );
  });

  it('un adelanto sin total pide el total', () => {
    expect(errorsFor({ advancePen: '500' }).budgetPen).toBe('Indica el monto total del adelanto.');
  });
});

describe('toFormValues', () => {
  it('cada proyecto del mock vuelve a pasar el esquema sin cambios de datos', () => {
    for (const project of mockProjects(new Date(2026, 9, 5))) {
      const data = projectSchema.parse(toFormValues(project));
      expect(data.name).toBe(project.name);
      expect(data.frontend).toEqual(project.stack.frontend);
      expect(data.linkDeploy).toBe(project.links.deploy ?? null);
      expect(data.budgetPen).toBe(project.budgetPen);
      expect(data.cms).toBe(project.cms);
    }
  });
});

describe('saveProject (Server Action)', () => {
  it('valida con el mismo esquema y devuelve fieldErrors', async () => {
    const result = await saveProject({ ...valid, name: '', linkRepo: 'javascript:x' });
    expect(result).toEqual({
      ok: false,
      error: 'Revisa los campos marcados.',
      fieldErrors: {
        name: 'Completa el nombre del proyecto.',
        linkRepo: 'Usa un enlace http(s) o un dominio (ej. polerastudio.pe).',
      },
    });
  });

  it('rechaza lo que no es un objeto', async () => {
    await expect(saveProject('hola')).resolves.toMatchObject({ ok: false });
  });

  it('con datos válidos responde ok (sin base todavía: persisted false)', async () => {
    await expect(saveProject(valid, 'agb')).resolves.toEqual({
      ok: true,
      data: { id: 'agb', persisted: false },
    });
  });
});
