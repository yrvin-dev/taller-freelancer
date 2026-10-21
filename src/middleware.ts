import { NextResponse, type NextRequest } from 'next/server';
import { isPublicPath, isServerActionRequest, loginPath } from '@/lib/auth-routes';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * Sin sesión, toda ruta privada redirige a `/login?next=…`; con sesión, `/login`
 * redirige al inicio. La autorización de verdad está en la base (RLS): esto es para
 * que la UI no muestre pantallas vacías a quien no entró.
 */
export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname, search } = request.nextUrl;

  const redirect = (to: string) => {
    const target = NextResponse.redirect(new URL(to, request.url));
    // Conserva las cookies que Supabase haya renovado en este pedido.
    for (const cookie of response.cookies.getAll()) target.cookies.set(cookie);
    return target;
  };

  // Una Server Action sin sesión no se redirige: responde 401 y la UI abre el diálogo.
  const action = isServerActionRequest(request.method, request.headers);
  if (!user && !action && !isPublicPath(pathname)) {
    return redirect(loginPath(`${pathname}${search}`));
  }
  if (user && pathname === '/login') return redirect('/');
  return response;
}

export const config = {
  // Todo menos los archivos estáticos (bundles, imágenes optimizadas, públicos).
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|mock/|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)',
  ],
};
