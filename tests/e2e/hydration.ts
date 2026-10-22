import { expect, type Locator } from '@playwright/test';

/**
 * Espera a que React haya hidratado el elemento antes de usarlo. Con `pnpm dev` el
 * HTML del servidor llega mucho antes que el JS: escribir o hacer clic antes de la
 * hidratación se pierde (el campo muestra el texto, pero React no se entera). React
 * marca cada nodo hidratado con una propiedad `__reactProps$…`.
 */
export async function hydrated(locator: Locator): Promise<Locator> {
  await expect(locator).toBeVisible();
  await expect
    .poll(() =>
      locator.evaluate((el) => Object.keys(el).some((key) => key.startsWith('__reactProps'))),
    )
    .toBe(true);
  return locator;
}
