import { defineConfig, devices } from '@playwright/test';
import { AUTH_FILE } from './tests/e2e/demo-user';

// Navegador real contra un build de producción propio (`.next-e2e`, puerto 3100) y la
// Supabase local: T21a (accesibilidad) y T22 (flujos). Contra `pnpm dev` los tests eran
// inestables (compila cada página al primer pedido) y además chocaban con su `.next`.
// La URL y la clave pública salen de .env.local, como en la app.
try {
  process.loadEnvFile('.env.local');
} catch {
  // En CI las variables llegan del entorno.
}

const BASE_URL = 'http://localhost:3100';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  // Margen para las navegaciones tras una Server Action con desktop y mobile en paralelo.
  expect: { timeout: 10_000 },
  forbidOnly: !!process.env.CI,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: BASE_URL, trace: 'retain-on-failure' },
  webServer: {
    // Siempre un build nuevo: reusar un servidor viejo probaría código anterior.
    command: 'pnpm e2e:build && pnpm e2e:start',
    url: `${BASE_URL}/login`,
    reuseExistingServer: false,
    timeout: 300_000,
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        storageState: AUTH_FILE,
      },
      dependencies: ['setup'],
    },
    {
      name: 'mobile',
      use: {
        ...devices['Pixel 7'],
        viewport: { width: 375, height: 812 },
        storageState: AUTH_FILE,
      },
      dependencies: ['setup'],
    },
  ],
});
