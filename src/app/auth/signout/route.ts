import { revalidatePath } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * "Cerrar sesión" y "Cambiar de cuenta" (formularios POST de la sidebar, Cuenta y 403).
 * Solo POST: un GET (un enlace o una imagen en otro sitio) no puede cerrarte la sesión.
 * 303 convierte el POST en un GET a /login.
 */
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  return NextResponse.redirect(new URL('/login', request.url), { status: 303 });
}
