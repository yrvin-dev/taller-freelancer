import type { NextConfig } from 'next';
import { STATIC_SECURITY_HEADERS } from './src/lib/security-headers';

/** Dominio de producción (T31). La URL de Vercel del proyecto sigue respondiendo, pero redirige aquí. */
export const PRODUCTION_HOST = 'tallerfreelance.com';
const VERCEL_PRODUCTION_HOST = 'taller-freelancer.vercel.app';

const nextConfig: NextConfig = {
  // Los e2e usan su propio build (`.next-e2e`, puerto 3100) para no pisar `pnpm dev`.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  reactStrictMode: true,
  poweredByHeader: false,
  // La CSP no va aquí: lleva un nonce por pedido y la pone el middleware.
  async headers() {
    return [{ source: '/:path*', headers: STATIC_SECURITY_HEADERS }];
  },
  // Solo el host exacto de producción en Vercel: los Preview (`taller-freelancer-git-…`)
  // y local no se tocan. 308 conserva el método (un POST sigue siendo POST).
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: VERCEL_PRODUCTION_HOST }],
        destination: `https://${PRODUCTION_HOST}/:path*`,
        permanent: true,
      },
    ];
  },
  experimental: {
    // Una miniatura pesa hasta 2 MB (`THUMBNAIL_MAX_BYTES`) y las Server Actions
    // aceptan 1 MB por defecto: el margen cubre la codificación del FormData.
    serverActions: { bodySizeLimit: '3mb' },
  },
  images: {
    // Foto de perfil de Google (Avatar con `src`).
    remotePatterns: [{ protocol: 'https', hostname: 'lh3.googleusercontent.com' }],
  },
};

export default nextConfig;
