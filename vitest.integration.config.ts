import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

// Tests contra Supabase local (`pnpm db:start`): RLS de verdad, con usuarios reales.
// Separados de `pnpm test` porque necesitan Docker.
export default defineConfig({
  plugins: [tsconfigPaths()],
  // Las Server Actions importan módulos `server-only`, que fuera de Next lanzan al cargarse.
  resolve: {
    alias: { 'server-only': new URL('./tests/stubs/server-only.ts', import.meta.url).pathname },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/integration/**/*.test.ts'],
    globalSetup: ['./tests/integration/global-setup.ts'],
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
});
