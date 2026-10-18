// Reglas de rutas de la autenticación (middleware, callback y login).

/** Rutas que se ven sin sesión. Todo lo demás es privado (01 §7). */
const PUBLIC_PATHS = ['/login', '/auth/callback', '/auth/signout'];
/** Herramientas de desarrollo: en producción responden 404 (T02, T04). */
const DEV_PATHS = ['/_tokens', '/_ui'];

export function isPublicPath(pathname: string): boolean {
  return [...PUBLIC_PATHS, ...DEV_PATHS].some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

/**
 * Destino tras el login (`?next=`). Solo rutas internas: evita un *open redirect*
 * (`?next=https://sitio-malo.com` o `//sitio-malo.com` llevarían fuera de la app).
 */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return '/';
  if (/[\r\n\t]/.test(next)) return '/';
  // `new URL` resuelve trucos como `/%2F%2Fmalo.com`: el host tiene que seguir siendo el nuestro.
  const base = 'http://app.local';
  const url = new URL(next, base);
  if (url.origin !== base) return '/';
  const path = `${url.pathname}${url.search}${url.hash}`;
  return isPublicPath(url.pathname) ? '/' : path;
}

/** `/proyectos/agb?tab=pagos` → `/login?next=%2Fproyectos%2Fagb%3Ftab%3Dpagos`. */
export function loginPath(next: string): string {
  const safe = safeNextPath(next);
  return safe === '/' ? '/login' : `/login?next=${encodeURIComponent(safe)}`;
}
