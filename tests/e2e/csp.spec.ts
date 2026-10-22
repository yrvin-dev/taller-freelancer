import { expect, test, type Page } from '@playwright/test';
import { seedData } from './demo-user';
import { hydrated } from './hydration';
import { PRIVATE_ROUTES, PUBLIC_ROUTES } from './routes';

// Cabeceras de seguridad en el build de producción (T23a). La CSP bloquea en silencio:
// un script sin nonce o una imagen de un origen no permitido no rompen ningún test
// funcional, solo dejan la página a medias. Aquí cualquier violación es un fallo.

/** Junta las violaciones que reporta el navegador desde antes de cargar la página. */
async function watchViolations(page: Page): Promise<() => Promise<string[]>> {
  await page.addInitScript(() => {
    const seen: string[] = [];
    Object.assign(window, { __cspViolations: seen });
    document.addEventListener('securitypolicyviolation', (e) =>
      seen.push(`${e.effectiveDirective} bloqueó ${e.blockedURI || '(inline)'}`),
    );
  });
  return () =>
    page.evaluate(() => (window as unknown as { __cspViolations: string[] }).__cspViolations);
}

async function expectCspHeaders(page: Page, path: string) {
  const response = await page.goto(path);
  const headers = response!.headers();
  const csp = headers['content-security-policy'];
  expect(csp).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/]+=*' 'strict-dynamic'/);
  expect(csp).not.toContain('unsafe-eval');
  expect(headers['x-frame-options']).toBe('DENY');
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');

  // Next le pone el nonce a todos sus scripts (el navegador lo oculta del atributo).
  const scripts = await page
    .locator('script')
    .evaluateAll((els) => els.map((el) => (el as HTMLScriptElement).nonce));
  expect(scripts.length).toBeGreaterThan(0);
  expect(scripts.every((nonce) => csp?.includes(`'nonce-${nonce}'`))).toBe(true);
}

test.describe('CSP', () => {
  for (const [name, path] of PRIVATE_ROUTES) {
    test(`${name}: cabeceras y sin violaciones`, async ({ page }) => {
      const violations = await watchViolations(page);
      await expectCspHeaders(page, path(seedData().projectId));
      await expect(page.locator('h1').first()).toBeVisible();
      await page.waitForLoadState('networkidle');
      expect(await violations()).toEqual([]);
    });
  }

  test('el nonce cambia en cada pedido', async ({ request }) => {
    const nonce = async () =>
      (await request.get('/proyectos'))
        .headers()
        ['content-security-policy']?.match(/'nonce-([^']+)'/)?.[1];
    const [a, b] = [await nonce(), await nonce()];
    expect(a).toBeTruthy();
    expect(a).not.toBe(b);
  });

  test('navegar entre páginas y abrir un diálogo no dispara violaciones', async ({ page }) => {
    const violations = await watchViolations(page);
    await page.goto(`/proyectos/${seedData().projectId}`);
    await (await hydrated(page.getByRole('link', { name: 'Accesos' }))).click();
    await expect(page).toHaveURL(/tab=accesos/);
    await (await hydrated(page.getByRole('button', { name: 'Agregar credencial' }))).click();
    await expect(page.getByRole('dialog', { name: 'Agregar credencial' })).toBeVisible();
    await page.keyboard.press('Escape');
    await (
      await hydrated(page.getByRole('main').getByRole('link', { name: 'Proyectos', exact: true }))
    ).click();
    await expect(page).toHaveURL(/\/proyectos$/);
    await page.waitForLoadState('networkidle');
    expect(await violations()).toEqual([]);
  });
});

test.describe('CSP sin sesión', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  for (const [name, path] of PUBLIC_ROUTES) {
    test(`${name}: cabeceras y sin violaciones`, async ({ page }) => {
      const violations = await watchViolations(page);
      await expectCspHeaders(page, path);
      await expect(page.getByRole('button', { name: 'Continuar con Google' })).toBeVisible();
      await page.waitForLoadState('networkidle');
      expect(await violations()).toEqual([]);
    });
  }
});
