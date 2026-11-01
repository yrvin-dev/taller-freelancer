// @vitest-environment node
import nextConfig, { PRODUCTION_HOST } from '../../next.config';

// T31: la URL de Vercel de producción redirige al dominio propio; nada más.
describe('redirección al dominio de producción', () => {
  it('solo para el host exacto de producción en Vercel, con 308', async () => {
    const rules = (await nextConfig.redirects?.()) ?? [];
    expect(rules).toEqual([
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'taller-freelancer.vercel.app' }],
        destination: `https://${PRODUCTION_HOST}/:path*`,
        permanent: true,
      },
    ]);
    expect(PRODUCTION_HOST).toBe('tallerfreelance.com');
  });
});
