import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { buttonClass } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { cx } from '@/lib/cx';

export const metadata: Metadata = { title: 'Política de privacidad · Taller Freelancer' };

const CONTACT = 'yrvin.dev@gmail.com';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="m-0 text-xl">{title}</h2>
      {children}
    </section>
  );
}

// Página pública que Google exige para publicar el login (02 §8.11, T27). Describe lo
// que la app hace de verdad: si cambia el manejo de datos, se actualiza esta página.
export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-bg p-[clamp(28px,5vw,64px)]">
      <div className="mx-auto flex max-w-[720px] flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Link href="/" className={cx(buttonClass({ variant: 'ghost' }), 'self-start')}>
            <Icon name="back" />
            Volver
          </Link>
          <h1 className="m-0">Política de privacidad</h1>
          <p className="m-0 text-sm text-neutral-700">Vigente desde el 29 de octubre de 2026.</p>
        </div>

        <Card>
          {/* Card ya trae p-3 y gap-2: el aire extra va adentro (gotcha de T04). */}
          <div className="flex flex-col gap-6 p-3">
            <Section title="Quién es responsable">
              <p className="m-0">
                Taller Freelancer es un proyecto personal de Yrvin, desarrollador web en Perú. Para
                cualquier consulta sobre tus datos, escribe a{' '}
                <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
              </p>
            </Section>

            <Section title="Qué datos usamos">
              <ul className="m-0 flex flex-col gap-1 pl-6">
                <li>
                  <strong>De tu cuenta de Google:</strong> solo tu nombre, tu correo y tu foto de
                  perfil. Google no nos da tu contraseña ni acceso a tu Gmail, tu Drive ni a ningún
                  otro servicio.
                </li>
                <li>
                  <strong>Lo que cargas en la app:</strong> tus proyectos, clientes, pagos, notas,
                  accesos, miniaturas y preferencias.
                </li>
                <li>
                  <strong>Cookies:</strong> solo las necesarias para mantener tu sesión y recordar
                  tus preferencias (tema claro u oscuro y la barra lateral). No usamos cookies de
                  publicidad ni de seguimiento.
                </li>
              </ul>
            </Section>

            <Section title="Para qué los usamos">
              <p className="m-0">
                Únicamente para identificarte y mostrarte tu espacio de trabajo. No vendemos ni
                compartimos tus datos con nadie, no mostramos publicidad y no usamos herramientas de
                analítica de terceros.
              </p>
            </Section>

            <Section title="Dónde se guardan y cómo se protegen">
              <ul className="m-0 flex flex-col gap-1 pl-6">
                <li>
                  Los datos se guardan en Supabase (base de datos y archivos), en servidores de São
                  Paulo, Brasil. La app se sirve desde Vercel.
                </li>
                <li>
                  Cada cuenta solo puede leer y modificar sus propios datos: la base de datos lo
                  impone en cada consulta.
                </li>
                <li>
                  Las contraseñas de tus clientes se guardan cifradas (AES-256-GCM) y solo se
                  descifran en el servidor cuando pulsas &ldquo;Mostrar&rdquo;.
                </li>
              </ul>
            </Section>

            <Section title="Tus derechos">
              <ul className="m-0 flex flex-col gap-1 pl-6">
                <li>
                  <strong>Llevarte tus datos:</strong> en Cuenta, &ldquo;Exportar datos&rdquo;
                  descarga todos tus proyectos en un archivo JSON.
                </li>
                <li>
                  <strong>Borrarlos:</strong> en Cuenta, &ldquo;Borrar cuenta&rdquo; elimina al
                  instante tu cuenta y todo lo que cargaste, miniaturas incluidas.
                </li>
                <li>
                  Para cualquier otra solicitud, escribe a{' '}
                  <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
                </li>
              </ul>
            </Section>

            <Section title="Cambios en esta política">
              <p className="m-0">
                Si cambia la forma en que la app usa tus datos, actualizaremos esta página y su
                fecha de vigencia.
              </p>
            </Section>
          </div>
        </Card>
      </div>
    </main>
  );
}
