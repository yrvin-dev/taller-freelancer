import { NextResponse, type NextRequest } from 'next/server';
import { isPublicPath, isServerActionRequest, loginPath } from '@/lib/auth-routes';
import { publicEnv } from '@/lib/env';
import { contentSecurityPolicy, createNonce } from '@/lib/security-headers';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * Sin sesión, toda ruta privada redirige a `/login?next=…`; con sesión, `/login`
 * redirige al inicio. La autorización de verdad está en la base (RLS): esto es para
 * que la UI no muestre pantallas vacías a quien no entró.
 *
 * También pone la CSP con un nonce nuevo. Va en el pedido (Next la lee de ahí para
 * ponerle el nonce a sus scripts) antes de `updateSession`, que reenvía el pedido.
 */
export async function middleware(request: NextRequest) {
  const csp = contentSecurityPolicy({
    nonce: createNonce(),
    supabaseUrl: publicEnv().NEXT_PUBLIC_SUPABASE_URL,
    dev: process.env.NODE_ENV === 'development',
  });
  request.headers.set('Content-Security-Policy', csp);

  const { response, user } = await updateSession(request);
  const { pathname, search } = request.nextUrl;

  const withCsp = (res: NextResponse) => {
    res.headers.set('Content-Security-Policy', csp);
    return res;
  };

  const redirect = (to: string) => {
    const target = NextResponse.redirect(new URL(to, request.url));
    // Conserva las cookies que Supabase haya renovado en este pedido.
    for (const cookie of response.cookies.getAll()) target.cookies.set(cookie);
    return withCsp(target);
  };

  // Una Server Action sin sesión no se redirige: responde 401 y la UI abre el diálogo.
  const action = isServerActionRequest(request.method, request.headers);
  if (!user && !action && !isPublicPath(pathname)) {
    return redirect(loginPath(`${pathname}${search}`));
  }
  if (user && pathname === '/login') return redirect('/');
  return withCsp(response);
}

export const config = {
  // Todo menos los archivos estáticos (bundles, imágenes optimizadas, públicos).
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|mock/|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)',
  ],
};
