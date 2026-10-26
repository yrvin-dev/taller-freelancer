import 'server-only';
import { headers } from 'next/headers';
import { publicEnv } from '@/lib/env';

// Solo un subdominio de vercel.app (sin puntos ni puertos): un Host inventado no
// puede convertirse en el destino del OAuth. Supabase además valida `redirectTo`
// contra su lista de Redirect URLs.
const VERCEL_HOST = /^[a-z0-9-]+\.vercel\.app$/;

type SiteUrlInput = {
  configured: string | undefined;
  vercelEnv: string | undefined;
  host: () => string | null | Promise<string | null>;
};

/**
 * URL base para el callback de OAuth. Producción y local usan `NEXT_PUBLIC_SITE_URL`.
 * En un Preview de Vercel (sin esa variable) se usa el host del propio pedido: cada
 * deploy tiene varias URLs (la del commit y la de la rama) y la cookie del PKCE queda
 * en la que abrió el usuario, así que el callback tiene que volver a esa misma.
 */
export async function resolveSiteUrl({ configured, vercelEnv, host }: SiteUrlInput) {
  if (configured) return configured;
  if (vercelEnv === 'preview') {
    const current = (await host())?.toLowerCase() ?? '';
    if (VERCEL_HOST.test(current)) return `https://${current}`;
  }
  throw new Error('Falta NEXT_PUBLIC_SITE_URL.');
}

export function siteUrl(): Promise<string> {
  return resolveSiteUrl({
    configured: publicEnv().NEXT_PUBLIC_SITE_URL,
    vercelEnv: process.env.VERCEL_ENV,
    host: async () => (await headers()).get('host'),
  });
}
