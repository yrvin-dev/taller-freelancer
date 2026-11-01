import { createHash, timingSafeEqual } from 'node:crypto';
import { sendEmail } from '@/lib/email';
import { publicEnv } from '@/lib/env';
import { cronSecret, remindersAvailable } from '@/lib/env-server';
import { todayIn } from '@/lib/format';
import { runReminderJob } from '@/lib/reminder-job';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

// Tarea diaria de recordatorios (T30b). La llama Vercel Cron (vercel.json) con
// `Authorization: Bearer <CRON_SECRET>`; cualquier otro pedido recibe 401.
export const dynamic = 'force-dynamic';

/** Compara en tiempo constante (sobre hashes de igual largo): no filtra la clave por tiempos. */
function authorized(header: string | null, secret: string): boolean {
  if (!header) return false;
  const digest = (value: string) => createHash('sha256').update(value).digest();
  return timingSafeEqual(digest(header), digest(`Bearer ${secret}`));
}

export async function GET(request: Request) {
  const secret = cronSecret();
  if (!secret || !authorized(request.headers.get('authorization'), secret)) {
    return Response.json({ error: 'No autorizado.' }, { status: 401 });
  }
  if (!remindersAvailable()) {
    return Response.json({ skipped: 'El envío de recordatorios no está configurado.' });
  }
  const siteUrl = publicEnv().NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) return Response.json({ error: 'Falta NEXT_PUBLIC_SITE_URL.' }, { status: 500 });

  const summary = await runReminderJob({
    admin: createSupabaseAdminClient(),
    send: sendEmail,
    today: todayIn(),
    siteUrl: siteUrl.replace(/\/$/, ''),
  });
  return Response.json(summary);
}
