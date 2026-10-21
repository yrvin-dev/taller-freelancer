import { NextRequest, NextResponse } from 'next/server';

// Supabase simulado: cada test decide si hay usuario y qué devuelve el canje.
const mocks = vi.hoisted(() => ({
  user: null as null | { id: string },
  exchangeError: null as null | { message: string },
  signOut: vi.fn(),
  signInWithOAuth: vi.fn(),
  exchange: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock('@/lib/supabase/middleware', () => ({
  updateSession: async (request: NextRequest) => ({
    response: NextResponse.next({ request }),
    user: mocks.user,
  }),
}));

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: async () => ({
    auth: {
      exchangeCodeForSession: async (code: string) => {
        mocks.exchange(code);
        return { error: mocks.exchangeError };
      },
      signOut: mocks.signOut,
      signInWithOAuth: mocks.signInWithOAuth,
    },
  }),
}));

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));

const { middleware } = await import('@/middleware');
const { GET: callback } = await import('@/app/auth/callback/route');
const { POST: signout } = await import('@/app/auth/signout/route');
const { signInWithGoogle } = await import('@/app/(auth)/login/actions');

const req = (path: string, init?: ConstructorParameters<typeof NextRequest>[1]) =>
  new NextRequest(new URL(path, 'http://localhost:3000'), init);
const location = (response: Response) => response.headers.get('location');

beforeEach(() => {
  mocks.user = null;
  mocks.exchangeError = null;
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:54321';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'clave-de-prueba';
  process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000';
});

describe('middleware', () => {
  it('sin sesión, una ruta privada redirige a /login con el destino', async () => {
    const response = await middleware(req('/proyectos/agb?tab=pagos'));
    expect(response.status).toBe(307);
    expect(location(response)).toBe(
      'http://localhost:3000/login?next=%2Fproyectos%2Fagb%3Ftab%3Dpagos',
    );
  });

  it('sin sesión, el inicio redirige a /login sin next', async () => {
    expect(location(await middleware(req('/')))).toBe('http://localhost:3000/login');
  });

  it('sin sesión, las rutas públicas pasan', async () => {
    for (const path of ['/login', '/auth/callback?code=x']) {
      expect(location(await middleware(req(path)))).toBeNull();
    }
  });

  it('sin sesión, una Server Action pasa (responde 401 ella misma); un POST cualquiera no', async () => {
    const action = req('/proyectos/agb', { method: 'POST', headers: { 'Next-Action': 'abc' } });
    expect(location(await middleware(action))).toBeNull();
    const form = req('/proyectos/agb', { method: 'POST' });
    expect(location(await middleware(form))).toBe(
      'http://localhost:3000/login?next=%2Fproyectos%2Fagb',
    );
  });

  it('con sesión, /login redirige al inicio y lo privado pasa', async () => {
    mocks.user = { id: 'u1' };
    expect(location(await middleware(req('/login')))).toBe('http://localhost:3000/');
    expect(location(await middleware(req('/proyectos')))).toBeNull();
  });
});

describe('/auth/callback', () => {
  it('canjea el código y lleva al destino interno', async () => {
    const response = await callback(req('/auth/callback?code=abc&next=%2Fcalendario'));
    expect(mocks.exchange).toHaveBeenCalledWith('abc');
    expect(location(response)).toBe('http://localhost:3000/calendario');
  });

  it('ignora un next externo (open redirect)', async () => {
    const response = await callback(req('/auth/callback?code=abc&next=https://malo.com'));
    expect(location(response)).toBe('http://localhost:3000/');
  });

  it('sin código o con canje fallido vuelve al login con error', async () => {
    expect(location(await callback(req('/auth/callback?error=access_denied')))).toBe(
      'http://localhost:3000/login?error=auth',
    );
    mocks.exchangeError = { message: 'expirado' };
    expect(location(await callback(req('/auth/callback?code=viejo')))).toBe(
      'http://localhost:3000/login?error=auth',
    );
  });
});

describe('/auth/signout', () => {
  it('cierra la sesión y redirige con 303 a /login', async () => {
    const response = await signout(req('/auth/signout', { method: 'POST' }));
    expect(mocks.signOut).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(303);
    expect(location(response)).toBe('http://localhost:3000/login');
  });
});

describe('signInWithGoogle', () => {
  const form = (next?: string) => {
    const data = new FormData();
    if (next) data.set('next', next);
    return data;
  };

  it('pide la URL de Google con el callback y el next saneado, y redirige', async () => {
    mocks.signInWithOAuth.mockResolvedValue({
      data: { url: 'https://accounts.google.com/x' },
      error: null,
    });
    await expect(signInWithGoogle(form('/proyectos'))).rejects.toThrow(
      'REDIRECT:https://accounts.google.com/x',
    );
    expect(mocks.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: 'http://localhost:3000/auth/callback?next=%2Fproyectos' },
    });
  });

  it('no propaga un next externo al callback', async () => {
    mocks.signInWithOAuth.mockResolvedValue({
      data: { url: 'https://accounts.google.com/x' },
      error: null,
    });
    await expect(signInWithGoogle(form('//malo.com'))).rejects.toThrow();
    expect(mocks.signInWithOAuth.mock.calls[0]![0].options.redirectTo).toBe(
      'http://localhost:3000/auth/callback',
    );
  });

  it('si Supabase falla, vuelve al login con error', async () => {
    mocks.signInWithOAuth.mockResolvedValue({ data: { url: null }, error: { message: 'x' } });
    await expect(signInWithGoogle(form())).rejects.toThrow('REDIRECT:/login?error=oauth');
  });
});
