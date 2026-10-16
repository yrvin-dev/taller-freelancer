'use client';

import { useState } from 'react';

const BGS = ['arena', 'pizarra', 'salvia'] as const;
const ACCENTS = ['naranja', 'terracota', 'mandarina', 'azul', 'turquesa'] as const;
const THEMES = ['light', 'dark'] as const;
const STEPS = [100, 200, 300, 400, 500, 600, 700, 800, 900] as const;
const RAMPS = ['neutral', 'accent', 'accent-2', 'success', 'info'] as const;
const ROLES = [
  'bg',
  'surface',
  'text',
  'divider',
  'accent',
  'accent-2',
  'process-yellow',
  'ink-deep',
  'on-accent',
] as const;
const STATUSES = [
  ['dev', 'En desarrollo'],
  ['review', 'Revisión'],
  ['prod', 'Producción'],
  ['maint', 'Mantenimiento'],
  ['archived', 'Archivado'],
] as const;
const RADII = ['sm', 'md', 'lg', 'pill'] as const;
const SHADOWS = ['sm', 'md', 'lg'] as const;
const SPACES = [1, 2, 3, 4, 6, 8] as const;

type Bg = (typeof BGS)[number];
type Accent = (typeof ACCENTS)[number];

function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className="block h-8 w-8 rounded-sm"
        style={{ background: `var(${color})`, boxShadow: 'inset 0 0 0 1px var(--color-divider)' }}
      />
      <span className="font-ui text-2xs">{label}</span>
    </div>
  );
}

function Panel({ theme, bg, accent }: { theme: string; bg: Bg; accent: Accent }) {
  return (
    <section
      data-theme={theme}
      data-bg={bg}
      data-accent={accent}
      className="flex flex-col gap-6 bg-bg p-6 text-text"
    >
      <h6>{theme}</h6>

      <div>
        <h5>Roles</h5>
        <div className="flex flex-wrap gap-2">
          {ROLES.map((r) => (
            <Swatch key={r} color={`--color-${r}`} label={r} />
          ))}
        </div>
      </div>

      {RAMPS.map((ramp) => (
        <div key={ramp}>
          <h5>{ramp}</h5>
          <div className="flex flex-wrap gap-1">
            {STEPS.map((s) => (
              <Swatch key={s} color={`--color-${ramp}-${s}`} label={String(s)} />
            ))}
          </div>
        </div>
      ))}

      <div>
        <h5>Estados</h5>
        <ul className="flex flex-wrap gap-3">
          {STATUSES.map(([key, label]) => (
            <li key={key} className="flex items-center gap-1 text-md">
              <span
                className="block h-2 w-2 rounded-full"
                style={{ background: `var(--status-${key})` }}
              />
              {label}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h1>Heading 1 · 42</h1>
        <h2>Heading 2 · 32</h2>
        <h3>Heading 3 · 25</h3>
        <h4>Heading 4 · 20</h4>
        <h5>Heading 5 · 16</h5>
        <h6>Heading 6 · overline 13</h6>
        <p>
          Cuerpo 15/1.55 en Source Serif 4, con <em>itálica real</em> y un{' '}
          <a href="#tokens">enlace en accent-700</a>.
        </p>
        <p className="font-ui text-md font-bold">Nunito 700 · marca y navegación</p>
        <p className="font-ui text-md font-extrabold">Nunito 800</p>
      </div>

      <div className="flex flex-wrap gap-3">
        {RADII.map((r) => (
          <div
            key={r}
            className="flex h-8 items-center bg-surface px-3 font-ui text-xs shadow-sm"
            style={{ borderRadius: `var(--radius-${r})` }}
          >
            radius-{r}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-4">
        {SHADOWS.map((s) => (
          <div
            key={s}
            className="rounded-lg bg-surface p-4 font-ui text-xs"
            style={{ boxShadow: `var(--shadow-${s})` }}
          >
            shadow-{s}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        {SPACES.map((n) => (
          <div key={n} className="flex items-center gap-2 font-ui text-2xs">
            <span className="w-8">space-{n}</span>
            <span className="block h-2 bg-accent" style={{ width: `var(--space-${n})` }} />
          </div>
        ))}
      </div>

      <button
        type="button"
        className="self-start rounded-pill bg-accent px-4 py-2 font-ui text-md font-bold leading-control text-on-accent"
      >
        Foco: tab hasta aquí
      </button>
    </section>
  );
}

export function TokensPreview() {
  const [bg, setBg] = useState<Bg>('arena');
  const [accent, setAccent] = useState<Accent>('naranja');

  return (
    <main id="tokens" className="flex flex-col gap-4 p-page">
      <div className="flex flex-wrap items-end gap-4 font-ui text-xs">
        <label className="flex flex-col gap-1">
          Fondo (data-bg)
          <select value={bg} onChange={(e) => setBg(e.target.value as Bg)}>
            {BGS.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Acento (data-accent)
          <select value={accent} onChange={(e) => setAccent(e.target.value as Accent)}>
            {ACCENTS.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {THEMES.map((t) => (
          <Panel key={t} theme={t} bg={bg} accent={accent} />
        ))}
      </div>
    </main>
  );
}
