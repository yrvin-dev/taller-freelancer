-- 0007 · Límite del "Enviar correo de prueba" (T30b).
--
-- Cada correo de prueba deja una fila aquí. La acción cuenta las del último día antes
-- de enviar (máximo 3), así nadie puede usar el botón para mandar correos sin fin.
-- Sin políticas: ni siquiera el dueño lee ni escribe con su sesión; lo hace solo el
-- servidor con service_role (regla 5, uso documentado), para que el límite no se pueda
-- borrar desde el navegador.

create table public.reminder_test_sends (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users on delete cascade,
  sent_at timestamptz not null default now()
);

create index reminder_test_sends_owner_idx on public.reminder_test_sends (owner_id, sent_at);

alter table public.reminder_test_sends enable row level security;
revoke all on public.reminder_test_sends from anon, authenticated;
