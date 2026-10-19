// Fuente única de esquemas (CLAUDE.md, regla 3). El mismo `projectSchema` valida el
// formulario en el cliente (React Hook Form + zodResolver) y la Server Action en el
// servidor: lo que pasa uno, pasa el otro.

import { z } from 'zod';
import { NO_CMS_LABEL, NOTE_KINDS, PROJECT_STATUSES, PROJECT_TYPES } from './domain';
import { parseDate } from './format';
import { externalHref } from './links';

const MAX_PEN = 99_999_999.99; // numeric(10,2)

const text = (max: number) => z.string().trim().max(max, `Máximo ${max} caracteres.`);

/** Texto opcional: vacío → `null` (columna nullable). */
const optionalText = (max: number) => text(max).transform((v) => v || null);

const required = (message: string, max: number) => text(max).min(1, message);

/** `'YYYY-MM-DD'` real (rechaza 2026-02-30) o vacío → `null`. */
const optionalDate = z
  .string()
  .trim()
  .refine((v) => v === '' || parseDate(v) !== null, 'Fecha inválida.')
  .transform((v) => v || null);

/** Enlace http(s) o dominio ("polerastudio.pe"); rechaza `javascript:` y texto suelto. */
export function isValidLink(value: string): boolean {
  if (/\s/.test(value)) return false;
  const href = externalHref(value);
  if (!href) return false;
  try {
    const { hostname } = new URL(href);
    return hostname.includes('.') || hostname === 'localhost';
  } catch {
    return false;
  }
}

const optionalLink = text(500)
  .refine(
    (v) => v === '' || isValidLink(v),
    'Usa un enlace http(s) o un dominio (ej. polerastudio.pe).',
  )
  .transform((v) => v || null);

const optionalEmail = text(254)
  .refine((v) => v === '' || z.email().safeParse(v).success, 'Correo inválido.')
  .transform((v) => v || null);

/** "+51 954 228 017": 6 a 15 dígitos, con espacios, guiones o paréntesis. */
const optionalPhone = text(25)
  .refine((v) => {
    if (v === '') return true;
    const digits = v.replace(/\D/g, '').length;
    return /^\+?[\d\s()-]+$/.test(v) && digits >= 6 && digits <= 15;
  }, 'Teléfono inválido (ej. +51 954 228 017).')
  .transform((v) => v || null);

/** "Astro, Tailwind, React" → ['Astro', 'Tailwind', 'React'] (sin vacíos ni repetidos). */
const techList = text(300)
  .transform((v) => [
    ...new Set(
      v
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    ),
  ])
  .refine((list) => list.every((t) => t.length <= 40), 'Cada tecnología: máximo 40 caracteres.');

/** Monto en soles ("7800", "7,800.50") o vacío → `null`. */
const optionalPen = text(20)
  .transform((v) => v.replace(/,/g, ''))
  .refine(
    (v) => v === '' || /^\d{1,8}(\.\d{1,2})?$/.test(v),
    'Monto inválido (ej. 7800 o 7800.50).',
  )
  .transform((v) => (v === '' ? null : Number(v)))
  .refine((v) => v === null || v <= MAX_PEN, 'Monto demasiado alto.');

export const projectSchema = z
  .object({
    // General
    name: required('Completa el nombre del proyecto.', 120),
    code: text(20)
      .regex(/^[A-Za-z0-9-]*$/, 'Solo letras, números y guiones (ej. AGB-2026).')
      .transform((v) => (v ? v.toUpperCase() : null)),
    type: z.enum(PROJECT_TYPES, 'Elige un tipo.'),
    status: z.enum(PROJECT_STATUSES, 'Elige un estado.'),
    deliveryDate: optionalDate,
    description: optionalText(1000),

    // Cliente (01 §3: un proyecto = un cliente)
    client: required('Completa el cliente.', 120),
    clientContact: optionalText(120),
    clientEmail: optionalEmail,
    clientWhatsapp: optionalPhone,
    clientCountry: optionalText(60),

    // Stack
    frontend: techList,
    backend: techList,
    db: techList,
    hosting: techList,
    // Texto libre (columna `cms text`): el select ofrece CMS_OPTIONS, pero un proyecto
    // puede tener otro ("Medusa Admin"). "Sin CMS" o vacío → null.
    cms: text(60).transform((v) => (v === '' || v === NO_CMS_LABEL ? null : v)),

    // Accesos
    localPath: optionalText(260),
    linkRepo: optionalLink,
    linkDeploy: optionalLink,
    linkCms: optionalLink,
    linkDesign: optionalLink,
    linkPanel: optionalLink,
    domainExpires: optionalDate,
    hostingExpires: optionalDate,
    domainPending: z.boolean(),

    // Pagos: el adelanto solo al crear (genera el primer pago).
    budgetPen: optionalPen,
    advancePen: optionalPen,

    // Primera entrada de la bitácora (solo al crear)
    firstNote: optionalText(2000),
  })
  .superRefine((data, ctx) => {
    if (data.advancePen !== null && data.budgetPen === null) {
      ctx.addIssue({
        code: 'custom',
        path: ['budgetPen'],
        message: 'Indica el monto total del adelanto.',
      });
    }
    if (data.advancePen !== null && data.budgetPen !== null && data.advancePen > data.budgetPen) {
      ctx.addIssue({
        code: 'custom',
        path: ['advancePen'],
        message: 'El adelanto no puede superar el monto total.',
      });
    }
  });

/** Lo que maneja el formulario (todo texto, salvo el checkbox). */
export type ProjectFormValues = z.input<typeof projectSchema>;
/** Lo que llega a la base, ya validado y normalizado. */
export type ProjectInput = z.output<typeof projectSchema>;

/** Primer mensaje de cada campo con error (para `fieldErrors` de la Server Action). */
export function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.');
    if (key && !(key in errors)) errors[key] = issue.message;
  }
  return errors;
}

/** Preferencias de Cuenta (tabla `profiles`): se guardan al salir de cada campo. */
export const preferencesSchema = z.object({
  displayName: required('Escribe cómo quieres que te saludemos.', 60),
  basePath: optionalText(260),
});

export type PreferencesValues = z.input<typeof preferencesSchema>;

/** Ids que llegan del cliente a una Server Action: UUID o nada. */
export const idSchema = z.uuid('Identificador inválido.');

/** Entrada nueva de la bitácora (Notas de la ficha). */
export const noteInputSchema = z.object({
  projectId: idSchema,
  kind: z.enum(NOTE_KINDS, 'Elige el tipo de entrada.'),
  body: required('Escribe la entrada.', 2000),
});
