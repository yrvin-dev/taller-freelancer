import type { Config } from 'tailwindcss';

// El mapeo de colores, radios, sombras y espaciado a var(--*) llega en T02.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
