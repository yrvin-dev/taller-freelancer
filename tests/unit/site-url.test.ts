import { resolveSiteUrl } from '@/lib/site-url';

const host = (value: string | null) => () => value;

describe('resolveSiteUrl', () => {
  it('usa NEXT_PUBLIC_SITE_URL si está, también en un Preview', async () => {
    const leeHost = vi.fn(() => 'otro.vercel.app');
    await expect(
      resolveSiteUrl({ configured: 'https://taller.app', vercelEnv: 'preview', host: leeHost }),
    ).resolves.toBe('https://taller.app');
    expect(leeHost).not.toHaveBeenCalled();
  });

  it('en un Preview sin la variable, vuelve al host del pedido (por https)', async () => {
    for (const h of ['taller-git-feat-x-yrvin.vercel.app', 'Taller-ABC123-yrvin.vercel.app']) {
      await expect(
        resolveSiteUrl({ configured: undefined, vercelEnv: 'preview', host: host(h) }),
      ).resolves.toBe(`https://${h.toLowerCase()}`);
    }
  });

  it('rechaza un host que no sea un subdominio de vercel.app', async () => {
    for (const h of [
      'malo.com',
      'vercel.app.malo.com',
      'a.b.vercel.app',
      'taller.vercel.app:8080',
      'taller.vercel.app/x',
      '',
      null,
    ]) {
      await expect(
        resolveSiteUrl({ configured: undefined, vercelEnv: 'preview', host: host(h) }),
      ).rejects.toThrow('Falta NEXT_PUBLIC_SITE_URL.');
    }
  });

  it('fuera de un Preview (producción, local) la variable es obligatoria', async () => {
    for (const vercelEnv of ['production', 'development', undefined]) {
      await expect(
        resolveSiteUrl({ configured: undefined, vercelEnv, host: host('taller.vercel.app') }),
      ).rejects.toThrow('Falta NEXT_PUBLIC_SITE_URL.');
    }
  });
});
