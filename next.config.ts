import type { NextConfig } from 'next';
import { STATIC_SECURITY_HEADERS } from './src/lib/security-headers';

const nextConfig: NextConfig = {
  // Los e2e usan su propio build (`.next-e2e`, puerto 3100) para no pisar `pnpm dev`.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  reactStrictMode: true,
  poweredByHeader: false,
  // La CSP no va aquí: lleva un nonce por pedido y la pone el middleware.
  async headers() {
    return [{ source: '/:path*', headers: STATIC_SECURITY_HEADERS }];
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
