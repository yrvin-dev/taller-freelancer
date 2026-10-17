import { todayIn, toISODate } from '@/lib/format';
import { mockProjects } from '@/lib/mock/projects';
import { MOCK_USER } from '@/lib/mock/user';

// "Exportar datos" de Cuenta: descarga un JSON con los proyectos, clientes, pagos y
// notas del usuario. **Sin credenciales** (ni etiquetas ni secretos): un archivo
// descargado no tiene RLS ni cifrado. Con la base: leer solo lo del usuario (RLS).
export function GET() {
  const today = todayIn();
  const proyectos = mockProjects(today).map(({ credentials, ...project }) => project);
  const body = JSON.stringify(
    { exportadoEl: new Date().toISOString(), usuario: MOCK_USER.email, proyectos },
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
