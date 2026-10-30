import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { cookies } from 'next/headers';
import type { ReactNode } from 'react';
// UIcons self-hosted (sin CDN en la CSP): solo los tres sets que usa la UI.
import '@flaticon/flaticon-uicons/css/regular/rounded.css';
import '@flaticon/flaticon-uicons/css/solid/rounded.css';
import '@flaticon/flaticon-uicons/css/brands/all.css';
import '@/styles/globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { parseTheme, THEME_COOKIE } from '@/lib/theme';

// Las familias se exponen como variables; tokens.css las compone en --font-*.
// Fuentes dentro del repo (src/app/fonts, licencia OFL), no `next/font/google`: esa
// descarga el CSS de Google Fonts al compilar y en Vercel fallaba a veces (T28). Son
// variables (un archivo cubre todos los grosores) y solo el subconjunto latin, el mismo
// que se pedía a Google.
const sourceSerif = localFont({
  src: [
    { path: './fonts/source-serif-4-latin-wght-normal.woff2', weight: '200 900', style: 'normal' },
    { path: './fonts/source-serif-4-latin-wght-italic.woff2', weight: '200 900', style: 'italic' },
  ],
  variable: '--font-source-serif',
  display: 'swap',
});

const nunito = localFont({
  src: './fonts/nunito-latin-wght-normal.woff2',
  weight: '200 1000',
  variable: '--font-nunito',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Taller Freelancer',
  description:
    'Administra tus proyectos de cliente: stack, accesos, enlaces, pagos y vencimientos.',
};

// viewport-fit=cover: sin esto env(safe-area-inset-*) vale 0 y la BottomNav queda
// bajo la barra de inicio del iPhone.
export const viewport: Viewport = { viewportFit: 'cover' };

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  // El tema llega en el HTML del servidor (cookie), así no hay parpadeo al cargar.
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);

  return (
    <html lang="es-PE" data-theme={theme} className={`${sourceSerif.variable} ${nunito.variable}`}>
      <body>
        <ThemeProvider initialTheme={theme}>{children}</ThemeProvider>
      </body>
    </html>
  );
}
