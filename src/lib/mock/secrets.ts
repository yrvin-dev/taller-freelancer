import 'server-only';

// Secretos de prueba hasta la tanda de credenciales (AES-256-GCM con CREDENTIALS_KEY).
// `server-only` hace fallar el build si este módulo llega a un componente del cliente:
// los secretos nunca viajan en el HTML ni en el bundle.

const MOCK_SECRETS: Record<string, string> = {
  'snd:snd-c1': 'demo-railway-2026',
  'plv:plv-c1': 'demo-medusa-admin-2026',
  'plv:plv-c2': 'demo-cloudinary-2026',
};

export function mockSecret(projectId: string, credentialId: string): string | undefined {
  return MOCK_SECRETS[`${projectId}:${credentialId}`];
}
