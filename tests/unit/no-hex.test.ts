import { ESLint } from 'eslint';
import { beforeAll, describe, expect, it } from 'vitest';

const eslint = new ESLint();
const lint = async (code: string) => {
  const [result] = await eslint.lintText(code, { filePath: 'src/components/Fixture.tsx' });
  return result?.messages.filter((m) => m.ruleId === 'no-restricted-syntax') ?? [];
};

describe('regla no-hex', () => {
  // La primera pasada carga la config completa de ESLint (parser de TS, plugins de
  // Next): con toda la suite en paralelo supera los 5 s por defecto. Se calienta aquí.
  beforeAll(() => lint(''), 30_000);

  it.each([
    "export const c = '#EF7B3E';",
    "export const c = '#fff';",
    'export const c = `0 1px 2px ${0} #2c4059`;',
    "export const c = 'rgba(0, 0, 0, .5)';",
  ])('rechaza %s', async (code) => {
    expect(await lint(code)).toHaveLength(1);
  });

  it.each(["export const c = 'var(--color-accent)';", "export const href = '#tokens';"])(
    'acepta %s',
    async (code) => {
      expect(await lint(code)).toHaveLength(0);
    },
  );
});
