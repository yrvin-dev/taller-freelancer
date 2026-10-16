import type { Metadata } from 'next';
import { Nunito, Source_Serif_4 } from 'next/font/google';
import type { ReactNode } from 'react';
import '@/styles/globals.css';

// Las familias se exponen como variables; tokens.css las compone en --font-*.
const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '600'],
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

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    // data-theme fijo hasta T06 (ThemeSwitch con cookie).
    <html lang="es-PE" data-theme="light" className={`${sourceSerif.variable} ${nunito.variable}`}>
      <body>{children}</body>
    </html>
  );
}
