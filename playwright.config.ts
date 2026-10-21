import { defineConfig, devices } from '@playwright/test';
import { AUTH_FILE } from './tests/e2e/demo-user';

// Navegador real contra `pnpm dev` y la Supabase local (T21a: accesibilidad; T22 suma
// los flujos e2e). La URL y la clave pública salen de .env.local, como en la app.
try {
  process.loadEnvFile('.env.local');
} catch {
  // En CI las variables llegan del entorno.
}

const BASE_URL = 'http://localhost:3000';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  forbidOnly: !!process.env.CI,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: BASE_URL, trace: 'retain-on-failure' },
  webServer: {
    command: 'pnpm dev',
    url: `${BASE_URL}/login`,
    reuseExistingServer: true,
    timeout: 180_000,
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
