import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Los e2e usan su propio build (`.next-e2e`, puerto 3100) para no pisar `pnpm dev`.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Foto de perfil de Google (Avatar con `src`).
    remotePatterns: [{ protocol: 'https', hostname: 'lh3.googleusercontent.com' }],
  },
};

export default nextConfig;
