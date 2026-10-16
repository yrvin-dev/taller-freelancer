import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import prettier from 'eslint-config-prettier';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
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
      'out/**',
      'build/**',
      'coverage/**',
      'design/**',
      'next-env.d.ts',
    ],
  },
];

export default eslintConfig;
