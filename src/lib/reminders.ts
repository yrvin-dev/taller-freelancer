// Recordatorios por correo (T30a): qué avisar a un usuario hoy. Funciones puras: la
// tarea programada (T30b) les pasa los proyectos, el día en Lima y lo ya enviado.

import type { ProjectStatus, ReminderDays, ReminderKind } from './domain';
import { daysUntil } from './format';

/** Un vencimiento de dominio u hosting que ya pasó se avisa hasta 30 días después. */
export const OVERDUE_WINDOW_DAYS = 30;

/** Lo mínimo de un proyecto que necesita el cálculo (la tarea lee solo esas columnas). */
export type ReminderProject = {
  id: string;
  name: string;
  status: ProjectStatus;
  deliveryDate: string | null;
  domainExpires: string | null;
  hostingExpires: string | null;
};

export type DueReminder = {
  projectId: string;
  projectName: string;
  kind: ReminderKind;
  /** Fecha del evento, `'YYYY-MM-DD'`. */
  dueOn: string;
  /** Días desde hoy: 0 es hoy, negativo si ya pasó. */
  days: number;
};

/** Identifica un aviso: el mismo proyecto, tipo y fecha no se avisan dos veces. */
export function reminderKey(r: Pick<DueReminder, 'projectId' | 'kind' | 'dueOn'>): string {
  return `${r.projectId}:${r.kind}:${r.dueOn}`;
}

/**
 * Lo que hay que avisar hoy, de lo más urgente a lo menos:
 * - **Entregas** de los próximos `leadDays` días (o de hoy), salvo proyectos en
 *   Producción o Archivados, que ya no tienen entrega pendiente.
 * - **Dominio y hosting** que vencen en los próximos `leadDays` días, o que ya vencieron
 *   hace menos de 30 (por ejemplo, si el usuario activó los recordatorios tarde).
 *   Archivados no.
 * Se descarta lo que ya está en `sent` (claves de `reminderKey`).
 */
export function dueReminders(
  projects: ReminderProject[],
  today: Date,
  leadDays: ReminderDays,
  sent: ReadonlySet<string> = new Set(),
): DueReminder[] {
  return projects
    .filter((project) => project.status !== 'archivado')
    .flatMap((project) => {
      const candidates: [ReminderKind, string | null, number][] = [
        ['dominio', project.domainExpires, -OVERDUE_WINDOW_DAYS],
        ['hosting', project.hostingExpires, -OVERDUE_WINDOW_DAYS],
      ];
      if (project.status !== 'produccion') candidates.unshift(['entrega', project.deliveryDate, 0]);

      return candidates.flatMap(([kind, dueOn, from]) => {
        if (!dueOn) return [];
        const days = daysUntil(dueOn, today);
        if (days === null || days < from || days > leadDays) return [];
        const reminder = { projectId: project.id, projectName: project.name, kind, dueOn, days };
        return sent.has(reminderKey(reminder)) ? [] : [reminder];
      });
    })
    .sort((a, b) => a.days - b.days || a.projectName.localeCompare(b.projectName, 'es'));
}
