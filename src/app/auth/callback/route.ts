import { NextResponse, type NextRequest } from 'next/server';
import { safeNextPath } from '@/lib/auth-routes';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Vuelta de Google (vía Supabase Auth): canjea el `code` por la sesión (cookies) y
 * lleva a `next`, solo si es una ruta interna. La primera vez, el trigger
 * `handle_new_user` (T14) crea el perfil.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const next = safeNextPath(searchParams.get('next'));

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, request.url));
  }

  // Sin código (Google canceló o devolvió `error=`) o canje fallido.
  return NextResponse.redirect(new URL('/login?error=auth', request.url));
}
