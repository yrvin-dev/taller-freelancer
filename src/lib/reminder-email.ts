// Correo de recordatorios (T30a). Sin colores propios: un cliente de correo no lee las
// variables de tokens.css y la regla 1 prohíbe escribir hex fuera de ahí; además, un
// correo sobrio llega mejor a la bandeja de entrada. Versión HTML y versión de texto.

import { REMINDER_KIND_LABEL } from './domain';
import { formatDate, formatRelativeDays } from './format';
import type { DueReminder } from './reminders';

export type ReminderEmail = { subject: string; html: string; text: string };

/** Los nombres los escribe el usuario: nunca entran al HTML sin escapar. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** "vence el 5 nov (en 3 días)", "venció el 2 nov (hace 3 días)", "se entrega hoy". */
export function describeReminder(r: DueReminder): string {
  const when = r.days === 0 ? 'hoy' : `el ${formatDate(r.dueOn)} (${formatRelativeDays(r.days)})`;
  if (r.kind === 'entrega') return `se entrega ${when}`;
  return r.days < 0 ? `venció ${when}` : `vence ${when}`;
}

/** El asunto va en una cabecera del correo: sin saltos de línea que vengan del nombre. */
function subjectFor(reminders: DueReminder[]): string {
  if (reminders.length !== 1) return `${reminders.length} recordatorios de tus proyectos`;
  const [r] = reminders as [DueReminder];
  const subject = `${REMINDER_KIND_LABEL[r.kind]} de ${r.projectName}: ${describeReminder(r)}`;
  return subject.replace(/[\r\n]+/g, ' ');
}

/**
 * Un solo correo por usuario con todo lo pendiente, lo más urgente primero. `siteUrl`
 * sin barra final (`https://taller-freelancer.vercel.app`).
 */
export function buildReminderEmail({
  name,
  reminders,
  siteUrl,
}: {
  name: string;
  reminders: DueReminder[];
  siteUrl: string;
}): ReminderEmail {
  const accountUrl = `${siteUrl}/cuenta`;
  const items = reminders.map((r) => ({
    label: `${REMINDER_KIND_LABEL[r.kind]} · ${r.projectName}`,
    detail: describeReminder(r),
    url: `${siteUrl}/proyectos/${r.projectId}`,
  }));

  const text = [
    `Hola, ${name}:`,
    '',
    'Esto es lo que se viene en tus proyectos:',
    '',
    ...items.map((i) => `- ${i.label}: ${i.detail}\n  ${i.url}`),
    '',
    `Recibes este correo porque activaste los recordatorios en Taller Freelancer. Para dejar de recibirlos, desactívalos en ${accountUrl}`,
  ].join('\n');

  const html = `<!doctype html>
<html lang="es">
<body style="font-family: Georgia, serif; line-height: 1.5; max-width: 560px; margin: 0 auto; padding: 24px;">
  <p>Hola, ${escapeHtml(name)}:</p>
  <p>Esto es lo que se viene en tus proyectos:</p>
  <ul style="padding-left: 20px;">
${items
  .map(
    (i) =>
      `    <li style="margin-bottom: 8px;"><a href="${i.url}"><strong>${escapeHtml(i.label)}</strong></a>: ${escapeHtml(i.detail)}</li>`,
  )
  .join('\n')}
  </ul>
  <p><a href="${siteUrl}">Abrir Taller Freelancer</a></p>
  <hr>
  <p style="font-size: 13px;">Recibes este correo porque activaste los recordatorios en Taller Freelancer. Para dejar de recibirlos, <a href="${accountUrl}">desactívalos en Cuenta</a>.</p>
</body>
</html>`;

  return { subject: subjectFor(reminders), html, text };
}
