import type { Metadata } from 'next';
import { Icon } from '@/components/ui/Icon';
import { signInWithGoogle } from './actions';
import { GoogleButton } from './GoogleButton';

export const metadata: Metadata = { title: 'Iniciar sesión · Taller Freelancer' };

type LoginPageProps = { searchParams: Promise<{ next?: string; error?: string }> };

const ERRORS: Record<string, string> = {
  auth: 'No pudimos completar el inicio de sesión. Inténtalo de nuevo.',
  oauth: 'No pudimos conectar con Google. Inténtalo de nuevo.',
};

// Portada del export ("00 Inicio de sesión"): hero en degradado a la izquierda y el
// acceso con Google a la derecha; en mobile se apilan (flex-wrap con bases 420/380px).
export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next, error } = await searchParams;
  const errorMessage = error ? (ERRORS[error] ?? ERRORS.auth) : null;

  return (
    <main className="flex min-h-screen flex-wrap">
      <div className="flex min-h-[320px] flex-[1_1_420px] flex-col justify-between gap-8 bg-hero p-[clamp(28px,5vw,64px)] text-on-ink">
        <div className="flex items-center gap-2">
          <span className="grid h-[44px] w-[44px] place-items-center rounded-md bg-on-ink-chip">
            <Icon name="brand" solid className="text-[22px] text-process-yellow" />
          </span>
          <span className="flex flex-col font-ui leading-none">
            <span className="text-[22px] font-extrabold">Taller</span>
            <span className="mt-[3px] text-[10px] font-bold tracking-[0.24em] text-process-yellow">
              FREELANCER
            </span>
          </span>
        </div>

        <div className="flex max-w-[520px] flex-col gap-3">
          <h1 className="m-0 text-[clamp(34px,4.4vw,54px)] leading-[1.05] text-on-ink">
            Cada proyecto de cliente, ordenado en una sola ficha.
          </h1>
          <p className="m-0 text-[18px] leading-[1.5] text-on-ink-muted">
            Stack, ruta local, accesos, CMS, pagos y vencimientos de todos tus clientes, en tu
            propio espacio de trabajo.
          </p>
        </div>

        {/* El export usa blanco al 60% (≈ 4.0:1 donde cae en el degradado); al 82% pasa AA. */}
        <span className="text-sm text-on-ink-muted">Cada cuenta ve solo sus proyectos.</span>
      </div>

      <div className="grid flex-[1_1_380px] place-items-center bg-bg p-[clamp(28px,5vw,64px)]">
        <div className="flex w-full max-w-[380px] flex-col gap-4">
          <div className="flex flex-col gap-[calc(var(--space-1)*1.2)]">
            <h2 className="m-0 text-[30px]">Inicia sesión</h2>
            <p className="m-0 text-neutral-700">
              Entra con tu cuenta de Google. Si es tu primera vez, se crea tu espacio
              automáticamente.
            </p>
          </div>
          {errorMessage && (
            <p
              role="alert"
              className="m-0 rounded-md bg-accent-2-100 px-3 py-2 text-sm text-accent-2-800"
            >
              {errorMessage}
            </p>
          )}
          <form action={signInWithGoogle}>
            {/* `next` se vuelve a sanear en el servidor: nunca se confía en él. */}
            {next && <input type="hidden" name="next" value={next} />}
            <GoogleButton />
          </form>
          <span className="text-xs text-neutral-700">
            Solo usamos tu nombre, correo y foto de perfil para identificar tu cuenta.
          </span>
        </div>
      </div>
    </main>
  );
}
