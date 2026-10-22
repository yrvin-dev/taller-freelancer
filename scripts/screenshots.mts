// Capturas del README (T23a) en `docs/screenshots/*.webp`, tomadas del build de
// producción con el usuario demo local: solo datos ficticios del seed. Antes de
// commitearlas, hay que mirarlas (gotcha T09a).
//
// Uso: `pnpm e2e:build && pnpm e2e:start` en otra terminal, y `pnpm screenshots`.
// Es `.mts` por lo mismo que lighthouse-a11y.mts (tsx no transforma Playwright).

import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { chromium, type BrowserContextOptions } from '@playwright/test';
import { demoSession } from '../tests/e2e/demo-session';
import type { Theme } from '../tests/e2e/routes';

const BASE_URL = process.env.SCREENSHOTS_BASE_URL ?? 'http://localhost:3100';
const OUT = 'docs/screenshots';

const DESKTOP: BrowserContextOptions = { viewport: { width: 1440, height: 900 } };
const MOBILE: BrowserContextOptions = {
  viewport: { width: 375, height: 812 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
};

type Shot = {
  file: string;
  path: (id: string) => string;
  theme: Theme;
  device: BrowserContextOptions;
};

const SHOTS: Shot[] = [
  { file: 'inicio-light', path: () => '/', theme: 'light', device: DESKTOP },
  { file: 'proyectos-dark', path: () => '/proyectos', theme: 'dark', device: DESKTOP },
  {
    // Accesos y no Pagos: el `<input type="date">` de Pagos sale en formato del sistema
    // (mm/dd en Linux), no en es-PE.
    file: 'ficha-accesos-light',
    path: (id) => `/proyectos/${id}?tab=accesos`,
    theme: 'light',
    device: DESKTOP,
  },
  { file: 'inicio-mobile-dark', path: () => '/', theme: 'dark', device: MOBILE },
  { file: 'ficha-mobile-light', path: (id) => `/proyectos/${id}`, theme: 'light', device: MOBILE },
];

// El `sharp` que trae Next (gotcha T09a): no hace falta instalarlo aparte.
const require = createRequire(import.meta.url);
const sharp = require(require.resolve('sharp', { paths: [require.resolve('next')] })) as (
  input: Buffer,
) => { webp(options: { quality: number }): { toFile(path: string): Promise<unknown> } };

const session = await demoSession();
const browser = await chromium.launch();
await mkdir(OUT, { recursive: true });

for (const shot of SHOTS) {
  const context = await browser.newContext({
    ...shot.device,
    colorScheme: shot.theme,
    locale: 'es-PE',
    timezoneId: 'America/Lima',
  });
  await context.addCookies(
    [...session.cookies, { name: 'tf-theme', value: shot.theme }].map((c) => ({
      ...c,
      url: BASE_URL,
    })),
  );
  const page = await context.newPage();
  await page.goto(`${BASE_URL}${shot.path(session.projectId)}`);
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  const png = await page.screenshot();
  await sharp(png).webp({ quality: 82 }).toFile(`${OUT}/${shot.file}.webp`);
  console.log(`${OUT}/${shot.file}.webp`);
  await context.close();
}

await browser.close();
