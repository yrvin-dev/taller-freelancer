import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';

// Rutas protegidas en navegador real (T22). "Cerrar sesión" no se prueba aquí: el
// signOut de Supabase es global y cortaría la sesión demo de los tests en paralelo
// (está cubierto en tests/unit/auth-flow.test.ts).

test.describe('sin sesión', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('una ruta privada lleva al login y conserva el destino', async ({ page }) => {
    await page.goto('/proyectos?vista=tabla');
    await expect(page).toHaveURL('/login?next=%2Fproyectos%3Fvista%3Dtabla');
    await expect(page.getByRole('button', { name: 'Continuar con Google' })).toBeVisible();
  });
});

test.describe('con sesión', () => {
  test('/login lleva al inicio', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('un proyecto que no existe responde 404', async ({ page }) => {
    // Sin loading.tsx por encima de la ficha (T22), la respuesta no empieza en streaming
    // antes de notFound(): el código HTTP es 404 de verdad, no solo la pantalla.
    const response = await page.goto(`/proyectos/${randomUUID()}`);
    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole('heading', { level: 1, name: 'No encontramos esta página' }),
    ).toBeVisible();
  });
});
