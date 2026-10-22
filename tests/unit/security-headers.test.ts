import {
  contentSecurityPolicy,
  createNonce,
  STATIC_SECURITY_HEADERS,
} from '@/lib/security-headers';

const SUPABASE = 'https://abc.supabase.co';

/** `"script-src 'self' …; img-src …"` → `{ 'script-src': ["'self'", …], … }` */
function parse(csp: string): Record<string, string[]> {
  return Object.fromEntries(
    csp.split('; ').map((directive) => {
      const [name, ...values] = directive.split(' ');
      return [name!, values];
    }),
  );
}

describe('contentSecurityPolicy', () => {
  const csp = parse(contentSecurityPolicy({ nonce: 'abc123', supabaseUrl: `${SUPABASE}/` }));

  it('solo ejecuta scripts con el nonce del pedido', () => {
    expect(csp['script-src']).toEqual(["'self'", "'nonce-abc123'", "'strict-dynamic'"]);
    expect(csp['script-src']).not.toContain("'unsafe-inline'");
    expect(csp['script-src']).not.toContain("'unsafe-eval'");
  });

  it("solo en desarrollo permite 'unsafe-eval' (stacks de error de React)", () => {
    const dev = parse(contentSecurityPolicy({ nonce: 'n', supabaseUrl: SUPABASE, dev: true }));
    expect(dev['script-src']).toContain("'unsafe-eval'");
  });

  it('nadie puede embeber la app ni cambiar la base de las URLs', () => {
    expect(csp['frame-ancestors']).toEqual(["'none'"]);
    expect(csp['object-src']).toEqual(["'none'"]);
    expect(csp['base-uri']).toEqual(["'self'"]);
  });

  it('usa el origen de Supabase (sin la barra final) para imágenes, API y el OAuth', () => {
    expect(csp['img-src']).toContain(SUPABASE);
    expect(csp['connect-src']).toEqual(["'self'", SUPABASE]);
    expect(csp['form-action']).toEqual(["'self'", SUPABASE, 'https://accounts.google.com']);
  });

  it('permite el avatar de Google y las vistas previas locales de la miniatura', () => {
    expect(csp['img-src']).toEqual(
      expect.arrayContaining(['https://lh3.googleusercontent.com', 'blob:', 'data:']),
    );
  });
});

describe('createNonce', () => {
  it('da un valor distinto en cada pedido, válido en una CSP', () => {
    const nonces = new Set(Array.from({ length: 50 }, createNonce));
    expect(nonces.size).toBe(50);
    for (const nonce of nonces) expect(nonce).toMatch(/^[A-Za-z0-9+/]+=*$/);
  });
});

describe('STATIC_SECURITY_HEADERS', () => {
  const headers = Object.fromEntries(STATIC_SECURITY_HEADERS.map((h) => [h.key, h.value]));

  it('incluye las cabeceras que pide CLAUDE.md', () => {
    expect(headers['X-Frame-Options']).toBe('DENY');
    expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['Strict-Transport-Security']).toMatch(/^max-age=\d{8,}; includeSubDomains$/);
  });
});
