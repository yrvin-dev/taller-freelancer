// pnpm a11y:lighthouse — Lighthouse (solo accesibilidad) en todas las rutas, en light y
// dark, con perfil mobile y desktop (T21b). Sale con error si algo da menos de 100 o si
// falla alguna auditoría, aunque no pese en el puntaje (p. ej. WCAG 2.5.3).
//
// Mide el build de producción: `pnpm build && pnpm start` (con `pnpm dev` apagado).
// Usa la sesión del usuario demo local y el Chromium de Playwright.
//
// Es `.mts` a propósito: como ESM, tsx no transforma Lighthouse. Si lo hiciera, le
// agregaría `__name` a las funciones que Lighthouse ejecuta dentro de la página.

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from '@playwright/test';
import lighthouse, { type Config, type Flags } from 'lighthouse';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';
import { demoSession, type DemoSession } from '../tests/e2e/demo-session';
import { PRIVATE_ROUTES, PUBLIC_ROUTES, THEMES, type Theme } from '../tests/e2e/routes';

const BASE_URL = process.env.LIGHTHOUSE_BASE_URL ?? 'http://localhost:3000';
const PORT = 9333;

const FORM_FACTORS: [name: string, config: Config | undefined][] = [
  ['mobile', undefined], // perfil por defecto de Lighthouse
  ['desktop', desktopConfig],
];

const FLAGS: Flags = {
  port: PORT,
  onlyCategories: ['accessibility'],
  disableStorageReset: true, // si no, Lighthouse borra las cookies de la sesión
  ignoreStatusCode: true, // el 404 también se audita
  logLevel: 'error',
  output: 'json',
};

type Run = { path: string; theme: Theme; signedIn: boolean; config: Config | undefined };
type Score = { score: number; failed: string[] };

/** En dev el HTML carga `main-app.js` sin hash; el build le pone hash (`main-app-…js`). */
async function assertProductionServer() {
  const login = await fetch(`${BASE_URL}/login`).catch(() => null);
  if (!login) throw new Error(`No hay servidor en ${BASE_URL}: corre pnpm build && pnpm start.`);
  if ((await login.text()).includes('/_next/static/chunks/main-app.js')) {
    throw new Error('Eso es pnpm dev: Lighthouse mide el build (pnpm build && pnpm start).');
  }
}

/** Una corrida en un Chromium limpio (con cookies de tema y, si toca, de sesión). */
async function audit(run: Run, session: DemoSession): Promise<Score> {
  const profile = mkdtempSync(join(tmpdir(), 'tf-lighthouse-'));
  const context = await chromium.launchPersistentContext(profile, {
    args: [`--remote-debugging-port=${PORT}`],
  });
  try {
    await context.addCookies([
      { name: 'tf-theme', value: run.theme, url: BASE_URL },
      ...(run.signedIn ? session.cookies.map((c) => ({ ...c, url: BASE_URL })) : []),
    ]);
    const result = await lighthouse(`${BASE_URL}${run.path}`, FLAGS, run.config);
    if (!result) throw new Error(`Lighthouse no devolvió resultado para ${run.path}.`);
    const { categories, audits, finalDisplayedUrl } = result.lhr;
    // Si terminó en /login, la sesión no llegó: el puntaje no sería de esta página.
    if (run.signedIn && new URL(finalDisplayedUrl).pathname === '/login') {
      throw new Error(`${run.path} redirigió al login: la sesión demo no llegó.`);
    }
    const category = categories.accessibility!;
    return {
      score: Math.round((category.score ?? 0) * 100),
      failed: category.auditRefs
        .map((ref) => audits[ref.id]!)
        .filter((a) => a.scoreDisplayMode === 'binary' && a.score !== 1)
        .map((a) => a.id),
    };
  } finally {
    await context.close();
    rmSync(profile, { recursive: true, force: true });
  }
}

/** Lighthouse a veces pierde la conexión con el navegador: se reintenta una vez. */
async function auditWithRetry(run: Run, session: DemoSession): Promise<Score> {
  try {
    return await audit(run, session);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/Connection closed|Session closed|Target closed|Protocol error/.test(message)) throw error;
    return audit(run, session);
  }
}

async function main() {
  await assertProductionServer();
  const session = await demoSession();
  const pages: [name: string, path: string, signedIn: boolean][] = [
    ...PRIVATE_ROUTES.map(
      ([name, path]) => [name, path(session.projectId), true] as [string, string, boolean],
    ),
    ...PUBLIC_ROUTES.map(([name, path]) => [name, path, false] as [string, string, boolean]),
  ];

  let total = 0;
  let failing = 0;
  for (const theme of THEMES) {
    for (const [page, path, signedIn] of pages) {
      for (const [form, config] of FORM_FACTORS) {
        const { score, failed } = await auditWithRetry({ path, theme, signedIn, config }, session);
        total += 1;
        if (score < 100 || failed.length) failing += 1;
        console.log(
          `${String(score).padStart(3)}  ${theme.padEnd(5)}  ${form.padEnd(7)}  ${page}` +
            (failed.length ? `  ✗ ${failed.join(', ')}` : ''),
        );
      }
    }
  }

  console.log(`\n${total - failing}/${total} con 100 y sin auditorías fallidas.`);
  if (failing) process.exit(1);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
