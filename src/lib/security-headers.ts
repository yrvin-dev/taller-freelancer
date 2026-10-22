// Cabeceras de seguridad (CLAUDE.md, Seguridad). La CSP lleva un nonce distinto en
// cada pedido y la arma el middleware; el resto son fijas y van en `next.config.ts`.

/** Foto de perfil de Google (Avatar) y la pantalla de consentimiento del OAuth. */
const GOOGLE_AVATARS = 'https://lh3.googleusercontent.com';
const GOOGLE_ACCOUNTS = 'https://accounts.google.com';

export type CspOptions = {
  nonce: string;
  /** `NEXT_PUBLIC_SUPABASE_URL`: Auth, Storage y la API. */
  supabaseUrl: string;
  /** En desarrollo React necesita `eval` para reconstruir los stacks de error. */
  dev?: boolean;
};

/**
 * - `script-src`: solo scripts con el nonce del pedido. Next se lo pone a los suyos
 *   (lo lee de la cabecera del pedido) y `strict-dynamic` deja pasar los chunks que
 *   esos scripts cargan. Nada inline sin nonce: por eso el tema va en una cookie (T06).
 * - `style-src 'unsafe-inline'`: `next/image` y algunos componentes usan `style`.
 *   Un estilo inline no ejecuta código; el riesgo que importa lo cubre `script-src`.
 * - `form-action`: sin JavaScript, "Continuar con Google" es un POST que redirige a
 *   Supabase y de ahí a Google, y Chrome aplica la directiva a toda la cadena.
 */
export function contentSecurityPolicy({ nonce, supabaseUrl, dev = false }: CspOptions): string {
  const supabase = new URL(supabaseUrl).origin;
  const directives: [string, ...string[]][] = [
    ['default-src', "'self'"],
    [
      'script-src',
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      ...(dev ? ["'unsafe-eval'"] : []),
    ],
    ['style-src', "'self'", "'unsafe-inline'"],
    ['img-src', "'self'", 'data:', 'blob:', GOOGLE_AVATARS, supabase],
    ['font-src', "'self'"],
    ['connect-src', "'self'", supabase],
    ['form-action', "'self'", supabase, GOOGLE_ACCOUNTS],
    ['frame-ancestors', "'none'"],
    ['base-uri', "'self'"],
    ['object-src', "'none'"],
  ];
  return directives.map((parts) => parts.join(' ')).join('; ');
}

/** Un nonce nuevo por pedido: 128 bits aleatorios en base64. */
export function createNonce(): string {
  return btoa(crypto.randomUUID());
}

/** Fijas para todas las rutas. HSTS solo tiene efecto sobre HTTPS (Vercel). */
export const STATIC_SECURITY_HEADERS: { key: string; value: string }[] = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
];
