// Fuente única de íconos: Flaticon UIcons (regular rounded, solid rounded y brands).
// La UI pide íconos por nombre lógico; el glifo de UIcons se resuelve solo aquí.

type IconDef = { glyph: string; brand?: true };

export const ICONS = {
  // Navegación y layout
  home: { glyph: 'home' },
  folder: { glyph: 'folder' },
  folderOpen: { glyph: 'folder-open' },
  calendar: { glyph: 'calendar' },
  user: { glyph: 'user' },
  menu: { glyph: 'menu-burger' },
  apps: { glyph: 'apps' },
  list: { glyph: 'list' },
  back: { glyph: 'arrow-left' },
  forward: { glyph: 'arrow-right' },
  collapse: { glyph: 'angle-left' },
  external: { glyph: 'arrow-up-right-from-square' },
  logout: { glyph: 'sign-out-alt' },

  // Acciones
  plus: { glyph: 'plus' },
  addFolder: { glyph: 'add-folder' },
  addUser: { glyph: 'user-add' },
  edit: { glyph: 'edit' },
  pencil: { glyph: 'pencil' },
  trash: { glyph: 'trash' },
  copy: { glyph: 'copy-alt' },
  search: { glyph: 'search' },
  download: { glyph: 'download' },
  close: { glyph: 'cross' },
  check: { glyph: 'check' },
  toggleOn: { glyph: 'toggle-on' },
  toggleOff: { glyph: 'toggle-off' },

  // Feedback
  info: { glyph: 'info' },
  warning: { glyph: 'exclamation' },
  success: { glyph: 'check-circle' },
  lock: { glyph: 'lock' },

  // Dominio del proyecto
  repo: { glyph: 'code-branch' },
  deploy: { glyph: 'rocket-lunch' },
  design: { glyph: 'pen-nib' },
  stack: { glyph: 'layers' },
  cms: { glyph: 'layers' },
  database: { glyph: 'database' },
  hosting: { glyph: 'cloud' },
  domain: { glyph: 'globe' },
  payment: { glyph: 'credit-card' },
  history: { glyph: 'time-past' },
  alarm: { glyph: 'alarm-clock' },
  sun: { glyph: 'sun' },
  moon: { glyph: 'moon' },

  // Marca y terceros
  brand: { glyph: 'fire-flame-curved' },
  google: { glyph: 'google', brand: true },
  github: { glyph: 'github', brand: true },
} as const satisfies Record<string, IconDef>;

export type IconName = keyof typeof ICONS;

/**
 * Clases CSS de un ícono. `solid` usa el estilo relleno (ítem activo del menú, marca).
 * Los íconos de marca ignoran `solid`: solo existen en el set brands.
 */
export function iconClass(name: IconName, { solid = false }: { solid?: boolean } = {}): string {
  const def: IconDef = ICONS[name];
  const set = def.brand ? 'brands' : solid ? 'sr' : 'rr';
  return `fi fi-${set}-${def.glyph}`;
}
