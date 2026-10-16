import type { Metadata, Viewport } from 'next';
import { Nunito, Source_Serif_4 } from 'next/font/google';
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
const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '600', '700'], // 700: botón primario
  style: ['normal', 'italic'],
  variable: '--font-source-serif',
  display: 'swap',
});

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
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
