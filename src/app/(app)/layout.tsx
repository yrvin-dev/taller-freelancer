import { cookies } from 'next/headers';
import type { ReactNode } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { ToastProvider } from '@/components/ui/Toast';
import { parseSidebarExpanded, SIDEBAR_COOKIE } from '@/lib/layout-prefs';
import { MOCK_ACTIVE_PROJECTS, MOCK_USER } from '@/lib/mock/user';

// Shell de las páginas privadas. El guard de sesión y el usuario real llegan con auth;
// hasta entonces se usa MOCK_USER.
export default async function AppLayout({ children }: { children: ReactNode }) {
  const expanded = parseSidebarExpanded((await cookies()).get(SIDEBAR_COOKIE)?.value);

  return (
    <ToastProvider>
      <div className="flex min-h-screen">
        <Sidebar user={MOCK_USER} activeCount={MOCK_ACTIVE_PROJECTS} initialExpanded={expanded} />
        {/* Export: padding 22px 40px 60px en desktop. */}
        <main className="flex min-w-0 flex-1 flex-col px-page pb-[calc(var(--space-8)+var(--space-4))] pt-4">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
