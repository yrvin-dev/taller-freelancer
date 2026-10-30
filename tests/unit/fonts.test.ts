// @vitest-environment node
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

// Las fuentes viven en el repo (T28): `next/font/google` las bajaba de Google Fonts al
// compilar y en Vercel el build fallaba a veces ("An error occurred in 'next/font'").

const SRC = resolve(__dirname, '../../src');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

describe('fuentes', () => {
  it('nadie importa next/font/google', () => {
    const offenders = sourceFiles(SRC).filter((file) =>
      /from ['"]next\/font\/google['"]/.test(readFileSync(file, 'utf8')),
    );
    expect(offenders).toEqual([]);
  });

  it('los archivos que pide el layout existen y son WOFF2', () => {
    const layout = readFileSync(join(SRC, 'app/layout.tsx'), 'utf8');
    const paths = [...layout.matchAll(/'\.\/(fonts\/[^']+\.woff2)'/g)].map((m) => m[1]!);
    expect(paths.length).toBe(3);
    for (const path of paths) {
      const file = join(SRC, 'app', path);
      expect(existsSync(file)).toBe(true);
      expect(readFileSync(file).subarray(0, 4).toString()).toBe('wOF2');
    }
  });
});
