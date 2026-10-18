import { z } from 'zod';

// Variables públicas (las ve el navegador; están protegidas por RLS, no son secretos).
// Next solo inyecta en el cliente las que se leen de forma estática
// (`process.env.NEXT_PUBLIC_X`), por eso se listan una por una.
const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url('NEXT_PUBLIC_SUPABASE_URL debe ser una URL.'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Falta NEXT_PUBLIC_SUPABASE_ANON_KEY.'),
  NEXT_PUBLIC_SITE_URL: z.url('NEXT_PUBLIC_SITE_URL debe ser una URL.'),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

let cached: PublicEnv | null = null;

/** Valida al primer uso: un `.env.local` incompleto falla con un mensaje claro. */
export function publicEnv(): PublicEnv {
  cached ??= publicEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  });
  return cached;
}
