import { expect, test, type Page } from '@playwright/test';
import { seedData } from './demo-user';
import { hydrated } from './hydration';

// Lo que axe no mide (T21a): foco visible al tabular, diálogos con Esc y foco de
// vuelta, y objetivos táctiles de 44px en mobile (CLAUDE.md, regla 8).

async function open(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  await expect(page.locator('h1').first()).toBeVisible();
}

/** Lo que tiene el foco: etiqueta, nombre y si se ve el anillo (outline ≥ 2px). */
function focused(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return null;
    // El anillo puede estar en el elemento o en un contenedor (has-[:focus-visible]:outline,
    // como la tarjeta de proyecto o la miniatura).
    const hasRing = (node: Element) => {
      const style = getComputedStyle(node);
      return style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2;
    };
    let ring = false;
    for (let node: Element | null = el; node && !ring; node = node.parentElement) {
      ring = hasRing(node);
    }
    return {
      tag: el.tagName.toLowerCase(),
      name: (el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 40),
      ring,
    };
  });
}

test.describe('teclado', () => {
  test.beforeEach(({ isMobile }) => test.skip(isMobile, 'Teclado: solo desktop.'));

  for (const path of ['/', '/proyectos', '/cuenta']) {
    test(`Tab recorre ${path} con el foco siempre visible`, async ({ page }) => {
      await open(page, path);
      const seen: string[] = [];
      for (let i = 0; i < 25; i += 1) {
        await page.keyboard.press('Tab');
        const el = await focused(page);
        if (!el || el.tag === 'nextjs-portal') continue; // indicador de desarrollo de Next
        expect(el.ring, `sin anillo de foco: <${el.tag}> "${el.name}"`).toBe(true);
        seen.push(el.name);
      }
      expect(seen.length).toBeGreaterThan(5);
    });
  }

  test('el diálogo se abre con Enter, Esc lo cierra y el foco vuelve al botón', async ({
    page,
  }) => {
    await open(page, `/proyectos/${seedData().projectId}`);
    const trigger = await hydrated(page.getByRole('button', { name: 'Eliminar' }));
    await trigger.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    // Tab nunca llega a la página de atrás (es inerte). Un <dialog> modal nativo deja
    // pasar el foco a la interfaz del navegador (activeElement = body), y está bien.
    for (let i = 0; i < 8; i += 1) {
      await page.keyboard.press('Tab');
      const where = await dialog.evaluate((d) =>
        d.contains(document.activeElement) ? 'dialog' : document.activeElement?.tagName,
      );
      expect(['dialog', 'BODY']).toContain(where);
    }
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('el diálogo 401 no se cierra con Esc', async ({ page, context }) => {
    await open(page, `/proyectos/${seedData().projectId}?tab=notas`);
    await context.clearCookies();
    await (
      await hydrated(page.getByRole('textbox', { name: 'Entrada de la bitácora' }))
    ).fill('Prueba 401');
    await (await hydrated(page.getByRole('button', { name: 'Agregar a la bitácora' }))).click();
    const dialog = page.getByRole('dialog', { name: 'Tu sesión expiró' });
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeVisible();
  });
});

test.describe('objetivos táctiles', () => {
  test.beforeEach(({ isMobile }) => test.skip(!isMobile, 'Tamaño táctil: solo mobile.'));

  const PATHS = [
    '/',
    '/proyectos',
    '/proyectos?vista=tabla',
    '/calendario',
    '/cuenta',
    '/proyectos/nuevo',
  ];

  for (const path of PATHS) {
    test(`todo lo tocable mide ≥ 44px en ${path}`, async ({ page }) => {
      await open(page, path);
      await expectTouchTargets(page);
    });
  }

  for (const tab of ['resumen', 'cliente', 'stack', 'accesos', 'pagos', 'notas']) {
    test(`todo lo tocable mide ≥ 44px en la ficha · ${tab}`, async ({ page }) => {
      await open(page, `/proyectos/${seedData().projectId}?tab=${tab}`);
      await expectTouchTargets(page);
    });
  }
});

/**
 * Botones, enlaces y controles visibles de al menos 44×44. Un input dentro de su label
 * (checkbox, radio del Seg, archivo de la miniatura) se mide por el label, que es lo que
 * se toca. Quedan fuera los enlaces dentro de un párrafo (WCAG 2.5.8 los exime).
 */
async function expectTouchTargets(page: Page) {
  const small = await page.evaluate(() => {
    const selector =
      'a[href], button, input:not([type="hidden"]), select, textarea, [role="tab"], label:has(input)';
    return [...document.querySelectorAll<HTMLElement>(selector)]
      .filter((el) => {
        const box = el.getBoundingClientRect();
        if (box.width === 0 || box.height === 0) return false; // oculto
        if (el.closest('nextjs-portal')) return false;
        if (el.matches('input') && el.closest('label')) return false; // se toca su label
        if (el.tagName === 'A' && el.closest('p')) return false; // enlace en línea de texto
        return box.width < 44 || box.height < 44;
      })
      .map((el) => {
        const box = el.getBoundingClientRect();
        const name = (el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 30);
        return `<${el.tagName.toLowerCase()}> "${name}" ${Math.round(box.width)}×${Math.round(box.height)}`;
      });
  });
  expect(small).toEqual([]);
}
