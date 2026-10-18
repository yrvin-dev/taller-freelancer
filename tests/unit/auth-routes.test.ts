import { isPublicPath, loginPath, safeNextPath } from '@/lib/auth-routes';

describe('isPublicPath', () => {
  it.each([
    ['/login', true],
    ['/auth/callback', true],
    ['/auth/signout', true],
    ['/_ui', true],
    ['/', false],
    ['/proyectos', false],
    ['/cuenta/exportar', false],
    ['/loginx', false],
  ])('%s → %s', (path, expected) => {
    expect(isPublicPath(path)).toBe(expected);
  });
});

describe('safeNextPath (sin open redirects)', () => {
  it.each([
    ['/proyectos/agb', '/proyectos/agb'],
    ['/proyectos/agb?tab=pagos', '/proyectos/agb?tab=pagos'],
    [null, '/'],
    ['', '/'],
    ['https://malo.com', '/'],
    ['//malo.com', '/'],
    ['/\\malo.com', '/'],
    ['/%2F%2Fmalo.com', '/%2F%2Fmalo.com'], // ruta interna rara, no cambia de host
    ['javascript:alert(1)', '/'],
    ['/proyectos\r\nSet-Cookie: x', '/'],
    ['/login', '/'], // evita volver al login en bucle
    ['proyectos', '/'],
  ])('%j → %j', (next, expected) => {
    expect(safeNextPath(next)).toBe(expected);
  });
});

describe('loginPath', () => {
  it('lleva el destino codificado o nada si es el inicio', () => {
    expect(loginPath('/proyectos/agb?tab=pagos')).toBe(
      '/login?next=%2Fproyectos%2Fagb%3Ftab%3Dpagos',
    );
    expect(loginPath('/')).toBe('/login');
    expect(loginPath('//malo.com')).toBe('/login');
  });
});
