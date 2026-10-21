'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from 'react';
import { signInWithGoogle } from '@/app/(auth)/login/actions';
import { ToastProvider, useToast } from '@/components/ui/Toast';
import type { ActionFailure } from '@/lib/action-result';
import { SessionExpiredDialog } from './SessionExpiredDialog';

type ActionFeedbackApi = {
  /** El error de una Server Action: toast, o el diálogo 401 si la sesión expiró. */
  fail(result: ActionFailure): void;
};

const ActionFeedbackContext = createContext<ActionFeedbackApi | null>(null);

/**
 * Feedback de las acciones del shell `(app)`: incluye el `ToastProvider` y monta
 * `SessionExpiredDialog`, que se abre cuando una acción devuelve `code: 'unauthorized'`.
 */
export function ActionFeedbackProvider({
  children,
  aboveNav = false,
}: {
  children: ReactNode;
  aboveNav?: boolean;
}) {
  return (
    <ToastProvider aboveNav={aboveNav}>
      <SessionGuard>{children}</SessionGuard>
    </ToastProvider>
  );
}

function SessionGuard({ children }: { children: ReactNode }) {
  const toast = useToast();
  const [expired, setExpired] = useState(false);
  const [relogging, startRelogin] = useTransition();

  const fail = useCallback(
    (result: ActionFailure) => {
      if (result.code === 'unauthorized') setExpired(true);
      else toast.show(result.error, 'warning');
    },
    [toast],
  );

  // Vuelve a Google y, al entrar, a esta misma página (`next` se sanea en el servidor).
  function relogin() {
    const form = new FormData();
    form.set('next', `${window.location.pathname}${window.location.search}`);
    startRelogin(() => signInWithGoogle(form));
  }

  const api = useMemo(() => ({ fail }), [fail]);

  return (
    <ActionFeedbackContext.Provider value={api}>
      {children}
      <SessionExpiredDialog
        open={expired}
        relogging={relogging}
        onRelogin={relogin}
        onExit={() => window.location.assign('/login')}
      />
    </ActionFeedbackContext.Provider>
  );
}

export function useActionFeedback(): ActionFeedbackApi {
  const api = useContext(ActionFeedbackContext);
  if (!api) throw new Error('useActionFeedback debe usarse dentro de <ActionFeedbackProvider>.');
  return api;
}
