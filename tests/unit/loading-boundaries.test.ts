import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

// En producción (Next 15.5), un `loading.tsx` por encima de una página que navega solo
// por `searchParams` (filtros, vista, pestañas) deja ese segmento sin datos: el router
// los pide aparte (`server-patch`) y, según cómo caigan las respuestas, la transición
// queda suspendida para siempre y el clic no hace nada (T22). En `pnpm dev` no pasa.
// Esas páginas no llevan `loading.tsx` en su carpeta ni en ninguna de las de arriba.

const APP = 'src/app';

function pages(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return pages(path);
    return entry.name === 'page.tsx' ? [path] : [];
  });
}

/** Carpetas desde la de la página hasta `src/app`, ambas incluidas. */
function ancestors(page: string): string[] {
  const dirs: string[] = [];
  for (let dir = dirname(page); relative(APP, dir) !== '..'; dir = dirname(dir)) {
    dirs.push(dir);
    if (dir === APP) break;
  }
  return dirs;
}

const searchPages = pages(APP).filter((page) =>
  readFileSync(page, 'utf8').includes('searchParams'),
);

describe('loading.tsx y navegación por searchParams', () => {
  it('encuentra las páginas que navegan por searchParams', () => {
    expect(searchPages).toEqual(
      expect.arrayContaining([
        join(APP, '(app)/proyectos/page.tsx'),
        join(APP, '(app)/proyectos/[id]/page.tsx'),
      ]),
    );
  });

  it.each(searchPages)('%s no tiene un loading.tsx por encima', (page) => {
    const loadings = ancestors(page)
      .map((dir) => join(dir, 'loading.tsx'))
      .filter((file) => existsSync(file));
    expect(loadings).toEqual([]);
  });
});
