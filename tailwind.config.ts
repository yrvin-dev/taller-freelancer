import type { Config } from 'tailwindcss';

// Tailwind no define valores propios: cada escala se reemplaza (no se extiende)
// por referencias a los tokens de src/styles/tokens.css.
const ramp = (role: string) =>
  Object.fromEntries(
    [100, 200, 300, 400, 500, 600, 700, 800, 900].map((step) => [
      step,
      `var(--color-${role}-${step})`,
    ]),
  );

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      inherit: 'inherit',
      bg: 'var(--color-bg)',
      surface: 'var(--color-surface)',
      text: 'var(--color-text)',
      divider: 'var(--color-divider)',
      'ink-deep': 'var(--color-ink-deep)',
      'on-accent': 'var(--color-on-accent)',
      'on-ink': 'var(--color-on-ink)',
      'on-ink-muted': 'var(--color-on-ink-muted)',
      'on-ink-chip': 'var(--color-on-ink-chip)',
      'on-accent-muted': 'var(--color-on-accent-muted)',
      'on-accent-chip': 'var(--color-on-accent-chip)',
      'chip-yellow': 'var(--color-chip-yellow)',
      'card-foot': { DEFAULT: 'var(--color-card-foot)', hover: 'var(--color-card-foot-hover)' },
      'table-row': {
        border: 'var(--color-table-row-border)',
        hover: 'var(--color-table-row-hover)',
      },
      'process-yellow': 'var(--color-process-yellow)',
      danger: {
        DEFAULT: 'var(--color-danger)',
        hover: 'var(--color-danger-hover)',
        pressed: 'var(--color-danger-pressed)',
      },
      'on-danger': 'var(--color-on-danger)',
      'danger-text': 'var(--color-danger-text)',
      label: 'var(--color-label)',
      placeholder: 'var(--color-placeholder)',
      backdrop: 'var(--color-backdrop)',
      state: {
        hover: 'var(--state-hover)',
        pressed: 'var(--state-pressed)',
        'accent-hover': 'var(--state-accent-hover)',
        'accent-pressed': 'var(--state-accent-pressed)',
        'border-hover': 'var(--state-border-hover)',
        subtle: 'var(--state-subtle)',
        'accent-active': 'var(--state-accent-active)',
        'danger-hover': 'var(--state-danger-hover)',
        'current-hover': 'var(--state-current-hover)',
      },
      accent: { DEFAULT: 'var(--color-accent)', ...ramp('accent') },
      'accent-2': { DEFAULT: 'var(--color-accent-2)', ...ramp('accent-2') },
      neutral: ramp('neutral'),
      success: ramp('success'),
      info: ramp('info'),
      status: {
        dev: 'var(--status-dev)',
        review: 'var(--status-review)',
        prod: 'var(--status-prod)',
        maint: 'var(--status-maint)',
        archived: 'var(--status-archived)',
      },
    },
    spacing: {
      0: '0',
      px: '1px',
      1: 'var(--space-1)',
      2: 'var(--space-2)',
      3: 'var(--space-3)',
      4: 'var(--space-4)',
      6: 'var(--space-6)',
      8: 'var(--space-8)',
      page: 'var(--page-pad)',
    },
    borderRadius: {
      none: '0',
      sm: 'var(--radius-sm)',
      md: 'var(--radius-md)',
      lg: 'var(--radius-lg)',
      xl: 'var(--radius-xl)',
      pill: 'var(--radius-pill)',
      full: '50%',
    },
    boxShadow: {
      none: 'none',
      sm: 'var(--shadow-sm)',
      md: 'var(--shadow-md)',
      lg: 'var(--shadow-lg)',
      sidebar: 'var(--shadow-sidebar)',
      search: 'var(--shadow-search)',
    },
    fontFamily: {
      heading: 'var(--font-heading)',
      body: 'var(--font-body)',
      ui: 'var(--font-ui)',
    },
    fontSize: {
      '2xs': 'var(--text-2xs)',
      xs: 'var(--text-xs)',
      sm: 'var(--text-sm)',
      md: 'var(--text-md)',
      base: 'var(--text-base)',
      lg: 'var(--text-lg)',
      xl: 'var(--text-xl)',
      '2xl': 'var(--text-2xl)',
      '3xl': 'var(--text-3xl)',
      '4xl': 'var(--text-4xl)',
    },
    lineHeight: {
      none: '1',
      tight: 'var(--leading-tight)',
      control: 'var(--leading-control)',
      body: 'var(--leading-body)',
    },
    letterSpacing: {
      normal: '0',
      heading: 'var(--tracking-heading)',
      caps: 'var(--tracking-caps)',
    },
    backgroundImage: {
      none: 'none',
      featured: 'var(--gradient-featured)',
      avatar: 'var(--gradient-avatar)',
      hero: 'var(--gradient-hero)',
      progress: 'var(--gradient-progress)',
    },
    extend: {
      transitionTimingFunction: { out: 'var(--ease-out)', shell: 'var(--ease-shell)' },
      transitionDuration: { shell: 'var(--duration-shell)' },
      // Corte del export entre sidebar (desktop) y barra inferior (mobile).
      screens: { shell: '820px' },
    },
  },
  plugins: [],
};

export default config;
