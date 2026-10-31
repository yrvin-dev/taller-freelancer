import 'server-only';
import { cache } from 'react';
import { toISODateIn } from '@/lib/format';
import { REMINDER_DAYS_OPTIONS, type ReminderDays } from '@/lib/domain';
import type { CurrentProfile } from '@/lib/profile';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/** La base solo acepta 3, 7 o 14 (`check`); cualquier otra cosa vuelve a 7. */
function toReminderDays(value: number | undefined): ReminderDays {
  return (REMINDER_DAYS_OPTIONS as readonly number[]).includes(value ?? 0)
    ? (value as ReminderDays)
    : 7;
}

/**
 * El usuario de la sesión y su perfil (RLS: solo puede leer el suyo). `null` sin
 * sesión. `cache` evita repetir la consulta en el mismo pedido (layout + página).
 */
export const getCurrentProfile = cache(async (): Promise<CurrentProfile | null> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, avatar_url, base_path, created_at, reminders_enabled, reminder_days')
    .eq('id', user.id)
    .single();

  const meta = user.user_metadata as { full_name?: string; name?: string; avatar_url?: string };
  const displayName = profile?.display_name ?? meta.full_name ?? user.email ?? 'Usuario';
  const avatarUrl = profile?.avatar_url ?? meta.avatar_url;

  return {
    id: user.id,
    name: meta.full_name ?? meta.name ?? displayName,
    email: user.email ?? '',
    ...(avatarUrl ? { avatarUrl } : {}),
    displayName,
    basePath: profile?.base_path ?? '',
    memberSince: toISODateIn(new Date(profile?.created_at ?? user.created_at)),
    remindersEnabled: profile?.reminders_enabled ?? false,
    reminderDays: toReminderDays(profile?.reminder_days),
  };
});
