import { randomBytes } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';
import { demoClient } from './demo-session';
import { hydrated } from './hydration';

// Flujo principal del 03 §9 (T22), en desktop y mobile: crear → filtrar → ficha →
// pagos, notas y una credencial → eliminar. Cada corrida usa su propio proyecto
// (`E2E-…`), así los dos tamaños corren en paralelo y los datos del seed no cambian.

const code = () => `E2E-${randomBytes(3).toString('hex').toUpperCase()}`;

/** "Pagado S/ 500.00": `Intl` usa un espacio duro, por eso `\s`. */
const figure = (page: Page, label: string) =>
  page.locator('dt', { hasText: label }).locator('xpath=following-sibling::dd');
const pen = (amount: string) => new RegExp(`^S/\\s${amount.replace('.', '\\.')}$`);

let projectCode = '';

test.afterEach(async () => {
  // Si el flujo falló antes de "Eliminar", el proyecto no queda en la cuenta demo.
  if (!projectCode) return;
  const { error } = await (await demoClient()).from('projects').delete().eq('code', projectCode);
  if (error) throw error;
});

test('crear, filtrar, registrar pago, nota y credencial, y eliminar', async ({ page }) => {
  projectCode = code();
  const name = `E2E Flujo ${projectCode}`;
  const secret = `e2e-${randomBytes(6).toString('hex')}`;

  await test.step('crear el proyecto con monto y adelanto', async () => {
    await page.goto('/proyectos/nuevo');
    await (await hydrated(page.getByLabel('Nombre del proyecto *'))).fill(name);
    await page.getByLabel('Código').fill(projectCode);
    await page.getByLabel('Cliente *').fill('Cliente E2E');
    await page.getByLabel('Frontend').fill('Next.js, Tailwind');
    await page.getByLabel('Monto total (S/)').fill('1000');
    await page.getByLabel('Adelanto (S/)').fill('300');
    await page.getByRole('button', { name: 'Guardar proyecto' }).first().click();

    // El toast dura 2,2 s: se mira antes de esperar la navegación a la ficha.
    await expect(page.getByRole('status').getByText('Proyecto creado')).toBeVisible();
    await expect(page).toHaveURL(/\/proyectos\/[0-9a-f-]{36}$/);
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
  });
  const projectUrl = page.url();

  await test.step('filtrar por búsqueda y estado; la URL conserva los filtros', async () => {
    await page.goto('/proyectos');
    const search = await hydrated(page.getByRole('searchbox', { name: 'Buscar', exact: true }));
    await search.fill(projectCode);
    await expect(page).toHaveURL(new RegExp(`q=${projectCode}`));
    await page.getByRole('combobox', { name: 'Estado' }).selectOption('en_desarrollo');
    await expect(page).toHaveURL(/estado=en_desarrollo/);
    await expect(page.getByText(/^1 de \d+ proyectos$/)).toBeVisible();

    await page.reload();
    await expect(page.getByRole('searchbox', { name: 'Buscar', exact: true })).toHaveValue(
      projectCode,
    );
    await expect(page.getByRole('combobox', { name: 'Estado' })).toHaveValue('en_desarrollo');
    await (await hydrated(page.getByRole('link', { name }))).click();
    await expect(page).toHaveURL(projectUrl);
  });

  await test.step('pagos: registrar, rechazar lo que supera el saldo y persistir', async () => {
    await (await hydrated(page.getByRole('link', { name: 'Pagos' }))).click();
    await expect(figure(page, 'Pagado')).toHaveText(pen('300.00'));

    await (await hydrated(page.getByLabel('Monto (S/)'))).fill('200');
    await page.getByLabel('Concepto (opcional)').fill('Segundo pago');
    await page.getByRole('button', { name: 'Registrar pago' }).click();
    await expect(page.getByRole('status').getByText('Pago registrado')).toBeVisible();
    await expect(figure(page, 'Pagado')).toHaveText(pen('500.00'));

    await page.getByLabel('Monto (S/)').fill('600');
    await page.getByRole('button', { name: 'Registrar pago' }).click();
    await expect(page.getByLabel('Monto (S/)')).toHaveAccessibleDescription(
      /^El pago supera el saldo \(S\/\s500\.00\)\.$/,
    );
    await expect(figure(page, 'Pagado')).toHaveText(pen('500.00'));

    await page.reload();
    await expect(figure(page, 'Pagado')).toHaveText(pen('500.00'));
    await expect(page.getByText('Segundo pago')).toBeVisible();
  });

  await test.step('bitácora: agregar y borrar una nota', async () => {
    await (await hydrated(page.getByRole('link', { name: 'Notas' }))).click();
    const entry = await hydrated(page.getByRole('textbox', { name: 'Entrada de la bitácora' }));
    await entry.fill('Nota e2e');
    await page.getByRole('button', { name: 'Agregar a la bitácora' }).click();
    await expect(page.getByRole('status').getByText('Nota agregada')).toBeVisible();
    // La fila de la lista (el texto también estuvo en el campo mientras se guardaba).
    const note = page.getByRole('listitem').filter({ hasText: 'Nota e2e' });
    await expect(note).toHaveCount(1);
    await expect(note).not.toHaveAttribute('aria-busy', 'true');

    await page.getByRole('button', { name: /^Borrar entrada del / }).click();
    await page.getByRole('button', { name: 'Sí, borrar' }).click();
    await expect(page.getByRole('status').getByText('Entrada borrada')).toBeVisible();
    await page.reload();
    await expect(page.getByRole('listitem').filter({ hasText: 'Nota e2e' })).toHaveCount(0);
  });

  await test.step('credencial: se guarda cifrada y solo se ve al pulsar Mostrar', async () => {
    await (await hydrated(page.getByRole('link', { name: 'Accesos' }))).click();
    await (await hydrated(page.getByRole('button', { name: 'Agregar credencial' }))).click();
    const dialog = page.getByRole('dialog', { name: 'Agregar credencial' });
    await dialog.getByLabel('Nombre *').fill('Panel E2E');
    await dialog.getByLabel('Usuario').fill('admin');
    await dialog.getByLabel('Contraseña *').fill(secret);
    await dialog.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByRole('status').getByText('Credencial guardada')).toBeVisible();

    // El secreto no viaja en el HTML de la página (regla 6): solo al pulsar Mostrar.
    const html = await (await page.request.get(page.url())).text();
    expect(html).not.toContain(secret);
    await expect(page.getByText(secret)).toHaveCount(0);
    await page.getByRole('button', { name: 'Mostrar contraseña de Panel E2E' }).click();
    await expect(page.getByText(secret)).toBeVisible();
  });

  await test.step('eliminar el proyecto', async () => {
    await (await hydrated(page.getByRole('button', { name: 'Eliminar' }))).click();
    const dialog = page.getByRole('dialog', { name: `¿Eliminar ${name}?` });
    await dialog.getByRole('button', { name: 'Eliminar', exact: true }).click();
    await expect(page.getByRole('status').getByText('Proyecto eliminado')).toBeVisible();
    await expect(page).toHaveURL(/\/proyectos$/);
    await expect(page.getByRole('link', { name })).toHaveCount(0);
  });
});
