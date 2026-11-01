import 'server-only';
import { emailConfig } from './env-server';

// Envío de correos con la API HTTP de Resend (T30b), sin SDK: un solo `fetch`.
// Docs: https://resend.com/docs/api-reference/emails/send-email

export type OutgoingEmail = { to: string; subject: string; html: string; text: string };
export type SendResult = { ok: true; id: string } | { ok: false; error: string };

const RESEND_URL = 'https://api.resend.com/emails';

/**
 * Envía un correo. Nunca lanza: devuelve el resultado para que la tarea diaria siga con
 * el resto de usuarios. `idempotencyKey` evita un duplicado si se reintenta el mismo
 * envío (Resend lo recuerda 24 h).
 */
export async function sendEmail(
  email: OutgoingEmail,
  idempotencyKey?: string,
): Promise<SendResult> {
  try {
    const { apiKey, from } = emailConfig();
    const response = await fetch(RESEND_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
      },
      body: JSON.stringify({ from, ...email }),
    });
    const body = (await response.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!response.ok || !body.id) {
      return {
        ok: false,
        error: `Resend respondió ${response.status}: ${body.message ?? 'sin detalle'}`,
      };
    }
    return { ok: true, id: body.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}
