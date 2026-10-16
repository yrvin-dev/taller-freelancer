import { cx } from '@/lib/cx';
import type { Theme } from '@/lib/theme';

export type ThemeSwitchProps = { theme: Theme; onToggle(): void; size?: 'sm' | 'md' };

// Tamaños del export: 38×22 en la sidebar y 54×31 en el header (botón de 62×48).
const SVG_SIZE = { sm: { width: 38, height: 22 }, md: { width: 54, height: 31 } } as const;
const BUTTON = {
  sm: 'h-[44px] w-[44px]',
  md: 'h-[48px] w-[62px]',
} as const;

const SUN_RAYS =
  'M37 9.6v1.3M37 19.1v1.3M31.6 15h1.3M41.1 15h1.3M33.2 11.2l.9.9M39.9 17.9l.9.9M33.2 18.8l.9-.9M39.9 12.1l.9-.9';
const MOON = 'M16.5 9.6a5.6 5.6 0 1 0 0 10.8a4.6 4.6 0 0 1 0-10.8z';

/** El SVG del export (pista 52×30 con luna y sol). Los colores salen de --switch-*. */
function SwitchGraphic({ dark, size }: { dark: boolean; size: 'sm' | 'md' }) {
  const stroke = { stroke: 'var(--switch-stroke)', strokeWidth: 2 };
  const glyph = 'var(--switch-glyph)';

  return (
    <svg {...SVG_SIZE[size]} viewBox="0 0 52 30" className="flex-none" aria-hidden="true">
      {dark ? (
        <>
          <rect
            x="1.5"
            y="1.5"
            width="49"
            height="27"
            rx="13.5"
            style={{ fill: 'var(--switch-dark-track)', ...stroke }}
          />
          <circle cx="15" cy="15" r="10.5" style={{ fill: 'var(--switch-dark-knob)', ...stroke }} />
          <path
            d={MOON}
            fill="none"
            strokeWidth="2.2"
            strokeLinejoin="round"
            style={{ stroke: glyph }}
          />
          <circle cx="37" cy="15" r="2.8" fill="none" strokeWidth="1.8" style={{ stroke: glyph }} />
          <path d={SUN_RAYS} strokeWidth="1.8" strokeLinecap="round" style={{ stroke: glyph }} />
        </>
      ) : (
        <>
          <rect
            x="1.5"
            y="1.5"
            width="49"
            height="27"
            rx="13.5"
            style={{ fill: 'var(--switch-light-track)', ...stroke }}
          />
          <path
            d={MOON}
            fill="none"
            strokeWidth="2"
            strokeLinejoin="round"
            style={{ stroke: 'var(--switch-light-moon)' }}
          />
          <circle
            cx="37"
            cy="15"
            r="10.5"
            style={{ fill: 'var(--switch-light-knob)', ...stroke }}
          />
          <circle cx="37" cy="15" r="2.8" fill="none" strokeWidth="1.9" style={{ stroke: glyph }} />
          <path d={SUN_RAYS} strokeWidth="1.9" strokeLinecap="round" style={{ stroke: glyph }} />
        </>
      )}
    </svg>
  );
}

/** Switch de tema: `role="switch"` encendido = modo oscuro. */
export function ThemeSwitch({ theme, onToggle, size = 'md' }: ThemeSwitchProps) {
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Modo oscuro"
      title="Cambiar tema"
      onClick={onToggle}
      className={cx(
        'grid flex-none cursor-pointer place-items-center rounded-pill border-0 bg-transparent p-0',
        BUTTON[size],
      )}
    >
      <SwitchGraphic dark={dark} size={size} />
    </button>
  );
}
