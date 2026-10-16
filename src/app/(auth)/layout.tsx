import type { ReactNode } from 'react';
import { ToastProvider } from '@/components/ui/Toast';

// Páginas públicas (login): sin sidebar ni navegación.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
