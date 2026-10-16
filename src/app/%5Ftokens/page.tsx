import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { TokensPreview } from './TokensPreview';

// La carpeta es `%5Ftokens` porque `_tokens` sería una carpeta privada del App Router
// (sin ruta). Así la URL queda en /_tokens. Solo existe en desarrollo.
export const metadata: Metadata = { title: 'Tokens · Taller Freelancer', robots: 'noindex' };

export default function TokensPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <TokensPreview />;
}
