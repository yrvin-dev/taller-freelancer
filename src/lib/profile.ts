// Tipos del perfil (sin dependencias de servidor: los usan también componentes cliente).

import type { ReminderDays } from './domain';

/** Lo que muestra el shell (sidebar). */
export type ShellUser = { name: string; email: string; avatarUrl?: string };

/** El usuario de la sesión con su fila de `profiles`. */
export type CurrentProfile = ShellUser & {
  id: string;
  /** "Nombre para el saludo" (Cuenta); al registrarse, el nombre de Google. */
  displayName: string;
  basePath: string;
  /** Fecha de alta en Lima, `'YYYY-MM-DD'`. */
  memberSince: string;
  /** Recordatorios por correo (T30a): desactivados hasta que el usuario los activa. */
  remindersEnabled: boolean;
  reminderDays: ReminderDays;
};
