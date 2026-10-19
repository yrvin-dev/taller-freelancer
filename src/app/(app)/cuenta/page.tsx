import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { DeleteAccountButton } from '@/components/account/DeleteAccountButton';
import { PreferencesForm } from '@/components/account/PreferencesForm';
import { Avatar } from '@/components/ui/Avatar';
import { buttonClass } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { formatMonthYear, todayIn } from '@/lib/format';
import { mockProjects } from '@/lib/mock/projects';
import { getCurrentProfile } from '@/lib/data/profile';

export const metadata: Metadata = { title: 'Cuenta · Taller Freelancer' };

// Portada de "06 Cuenta" con el perfil de la sesión (Google + `profiles`).
export default async function AccountPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');
  const projectCount = mockProjects(todayIn()).length;

  return (
    <div className="flex max-w-[680px] flex-col gap-8">
      <h1 className="m-0">Cuenta</h1>

      <section aria-labelledby="perfil" className="flex flex-col gap-3">
        <h2 id="perfil" className="m-0 text-xl">
          Perfil
        </h2>
        <div className="flex flex-wrap items-center gap-4 rounded-lg bg-surface p-6 shadow-sm">
          <Avatar name={profile.name} src={profile.avatarUrl} size={64} />
          <span className="flex min-w-0 flex-[1_1_220px] flex-col gap-[2px] leading-[1.3]">
            <span className="text-[18px] font-bold">{profile.name}</span>
            <span className="text-md text-neutral-700">{profile.email}</span>
            <span className="mt-[calc(var(--space-1)*1.2)] flex flex-wrap items-center gap-x-3 gap-y-[calc(var(--space-1)*1.2)] text-xs text-neutral-700">
              <span className="flex items-center gap-[calc(var(--space-1)*1.2)]">
                <Icon name="google" />
                Conectado con Google
              </span>
              <span>Miembro desde {formatMonthYear(profile.memberSince)}</span>
            </span>
          </span>
          {/* La ruta /auth/signout se crea en la tanda de auth. */}
          <form action="/auth/signout" method="post">
            <button type="submit" className={buttonClass({ variant: 'secondary' })}>
              <Icon name="logout" />
              Cerrar sesión
            </button>
          </form>
        </div>
        <p className="m-0 text-sm text-neutral-700">
          El nombre, el correo y la foto vienen de tu cuenta de Google. Para cambiarlos, edítalos en
          Google.
        </p>
      </section>

      <section aria-labelledby="preferencias" className="flex flex-col gap-4">
        <h2 id="preferencias" className="m-0 text-xl">
          Preferencias
        </h2>
        <PreferencesForm
          initial={{ displayName: profile.displayName, basePath: profile.basePath }}
        />
      </section>

      <section aria-labelledby="tus-datos" className="flex flex-col gap-3">
        <h2 id="tus-datos" className="m-0 text-xl">
          Tus datos
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex-[1_1_260px] text-md text-neutral-700">
            Descarga tus proyectos, clientes y pagos en un archivo JSON.
          </span>
          <a href="/cuenta/exportar" download className={buttonClass({ variant: 'secondary' })}>
            <Icon name="download" />
            Exportar datos
          </a>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex-[1_1_260px] text-md text-neutral-700">
            Borra tu cuenta y todos tus proyectos. No se puede deshacer.
          </span>
          <DeleteAccountButton projectCount={projectCount} />
        </div>
      </section>
    </div>
  );
}
