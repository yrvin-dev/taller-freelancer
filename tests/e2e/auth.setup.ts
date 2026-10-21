import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { test as setup } from '@playwright/test';
import { demoSession } from './demo-session';
import { AUTH_FILE, DATA_FILE, type SeedData } from './demo-user';

// Guarda la sesión del usuario demo para el resto de los tests.
setup('sesión del usuario demo', async ({ context, baseURL }) => {
  const { cookies, projectId } = await demoSession();
  await context.addCookies(cookies.map((cookie) => ({ ...cookie, url: baseURL! })));
  mkdirSync(dirname(AUTH_FILE), { recursive: true });
  await context.storageState({ path: AUTH_FILE });
  writeFileSync(DATA_FILE, JSON.stringify({ projectId } satisfies SeedData));
});
