import AxeBuilder from '@axe-core/playwright';
import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { seedData } from './demo-user';
import { hydrated } from './hydration';
import { PRIVATE_ROUTES, PUBLIC_ROUTES, THEMES, type Theme } from './routes';

// Auditoría WCAG 2.2 A/AA con axe (T21a) en cada ruta, diálogo y estado de la sidebar,
// en los dos temas. Corre en desktop (1440) y mobile (375): ver playwright.config.ts.

async function useTheme(context: BrowserContext, baseURL: string | undefined, theme: Theme) {
  await context.addCookies([{ name: 'tf-theme', value: theme, url: baseURL! }]);
}

/** Falla con una línea por regla: id, impacto y los primeros nodos afectados. */
async function expectNoViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .exclude('nextjs-portal') // indicador de desarrollo de Next, no es parte de la app
    .analyze();
  const summary = violations.map(
    (v) =>
      `${v.id} (${v.impact}): ${v.nodes
        .slice(0, 4)
        .map((n) => n.target.join(' '))
        .join(' | ')}`,
  );
  expect(summary).toEqual([]);
}

async function open(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0); // sin skeleton
  await expect(page.locator('h1').first()).toBeVisible();
}

for (const theme of THEMES) {
  test.describe(`tema ${theme}`, () => {
    test.beforeEach(async ({ context, baseURL }) => useTheme(context, baseURL, theme));

    for (const [name, path] of PRIVATE_ROUTES) {
      test(name, async ({ page }) => {
        await open(page, path(seedData().projectId));
        await expectNoViolations(page);
      });
    }

    test('sidebar expandida', async ({ page, context, baseURL, isMobile }) => {
      test.skip(isMobile, 'En mobile no hay sidebar (BottomNav).');
      await context.addCookies([{ name: 'tf-side', value: '1', url: baseURL! }]);
      await open(page, '/');
      await expect(page.getByRole('button', { name: 'Esconder menú' })).toBeVisible();
      await expectNoViolations(page);
    });

    test('diálogo: eliminar proyecto', async ({ page }) => {
      await open(page, `/proyectos/${seedData().projectId}`);
      await (await hydrated(page.getByRole('button', { name: 'Eliminar' }))).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await expectNoViolations(page);
    });

    test('diálogo: agregar credencial', async ({ page }) => {
      await open(page, `/proyectos/${seedData().projectId}?tab=accesos`);
      await (await hydrated(page.getByRole('button', { name: 'Agregar credencial' }))).click();
      await expect(page.getByRole('dialog', { name: 'Agregar credencial' })).toBeVisible();
      await expectNoViolations(page);
    });

    test('confirmación: borrar cuenta', async ({ page }) => {
      await open(page, '/cuenta');
      await (await hydrated(page.getByRole('button', { name: 'Borrar cuenta' }))).click();
      await expectNoViolations(page); // nunca se confirma: solo se audita
    });

    test('diálogo 401: sesión expirada', async ({ page, context }) => {
      await open(page, `/proyectos/${seedData().projectId}?tab=notas`);
      // Sin cookies de Supabase la acción responde 401 (no escribe nada).
      const theme = (await context.cookies()).filter((c) => c.name.startsWith('tf-'));
      await context.clearCookies();
      await context.addCookies(theme);
      await (
        await hydrated(page.getByRole('textbox', { name: 'Entrada de la bitácora' }))
      ).fill('Prueba 401');
      await (await hydrated(page.getByRole('button', { name: 'Agregar a la bitácora' }))).click();
      await expect(page.getByRole('dialog', { name: 'Tu sesión expiró' })).toBeVisible();
      await expectNoViolations(page);
    });
  });
}

test.describe('sin sesión', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  for (const theme of THEMES) {
    for (const [name, path] of PUBLIC_ROUTES) {
      test(`${name} · ${theme}`, async ({ page, context, baseURL }) => {
        await useTheme(context, baseURL, theme);
        await open(page, path);
        await expectNoViolations(page);
      });
    }
  }
});
