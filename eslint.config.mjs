import { createRequire } from 'module';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import prettier from 'eslint-config-prettier';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Los plugins de `next/*` (react-hooks, jsx-a11y…) son dependencias de
// eslint-config-next: se resuelven desde ahí. pnpm no los publica en la raíz de
// node_modules (`publicHoistPattern` vacío), así que desde `__dirname` no se encuentran.
const compat = new FlatCompat({
  baseDirectory: __dirname,
  resolvePluginsRelativeTo: dirname(
    createRequire(import.meta.url).resolve('eslint-config-next/package.json'),
  ),
});

// Regla dura 1 (CLAUDE.md): cero hex/rgb fuera de src/styles/tokens.css.
const COLOR_LITERAL = String.raw`/#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b|rgba?\(/`;
const NO_HEX_MESSAGE =
  'Color literal prohibido: usa var(--token) o una clase de Tailwind mapeada a tokens.css.';

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  prettier,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      // `const { secreto, ...resto } = obj` es la forma idiomática de omitir campos.
      '@typescript-eslint/no-unused-vars': ['warn', { ignoreRestSiblings: true }],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        { selector: `Literal[value=${COLOR_LITERAL}]`, message: NO_HEX_MESSAGE },
        { selector: `TemplateElement[value.raw=${COLOR_LITERAL}]`, message: NO_HEX_MESSAGE },
      ],
    },
  },
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      '.next-e2e/**',
      'out/**',
      'build/**',
      'coverage/**',
      'design/**',
      'next-env.d.ts',
      // Generado por `pnpm db:types` (CLAUDE.md, regla 3: no se edita a mano).
      'src/lib/database.types.ts',
    ],
  },
];

export default eslintConfig;
