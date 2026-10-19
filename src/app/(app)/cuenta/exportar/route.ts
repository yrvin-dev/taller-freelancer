import { todayIn, toISODate } from '@/lib/format';
import { mockProjects } from '@/lib/mock/projects';
import { getCurrentProfile } from '@/lib/data/profile';

// "Exportar datos" de Cuenta: descarga un JSON con los proyectos, clientes, pagos y
// notas del usuario. **Sin credenciales** (ni etiquetas ni secretos): un archivo
// descargado no tiene RLS ni cifrado. Con la base: leer solo lo del usuario (RLS).
export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile) return new Response('No autorizado', { status: 401 });

  const today = todayIn();
  const proyectos = mockProjects(today).map(({ credentials, ...project }) => project);
  const body = JSON.stringify(
    { exportadoEl: new Date().toISOString(), usuario: profile.email, proyectos },
    null,
    2,
  );

  return new Response(body, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="taller-freelancer-${toISODate(today)}.json"`,
      'Cache-Control': 'no-store',
    },
  });
}
