'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { IconName } from '@/lib/icons';
import { Icon } from './Icon';

export type ToastProps = { message: string; icon?: IconName };

// Portado del toast inline del export: invertido (fondo texto, texto fondo), abajo al
// centro, padding 10px 18px, gap 8px, ícono de 18px y sombra lg.
export function Toast({ message, icon = 'success' }: ToastProps) {
  return (
    <div className="fixed bottom-6 left-1/2 z-30 flex max-w-[calc(100vw-32px)] -translate-x-1/2 items-center gap-[calc(var(--space-2)*0.8)] rounded-lg bg-text px-[calc(var(--space-3)*1.2)] py-2 text-md text-bg shadow-lg">
      <Icon name={icon} className="text-[18px]" />
      {message}
    </div>
  );
}

/** Duración del export (`flash`): 2200 ms. */
export const TOAST_DURATION_MS = 2200;

type ToastState = ToastProps & { id: number };
type ToastApi = { show(message: string, icon?: IconName): void };

const ToastContext = createContext<ToastApi | null>(null);

/**
 * Un toast a la vez, como en el export: uno nuevo reemplaza al anterior y reinicia
 * el temporizador. La región `role="status"` está siempre montada para que los
 * lectores de pantalla anuncien cada mensaje.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);

  const show = useCallback((message: string, icon?: IconName) => {
    setToast((prev) => ({ id: (prev?.id ?? 0) + 1, message, icon }));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div role="status" aria-live="polite" aria-atomic="true">
        {toast && <Toast key={toast.id} message={toast.message} icon={toast.icon} />}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error('useToast debe usarse dentro de <ToastProvider>.');
  return api;
}
