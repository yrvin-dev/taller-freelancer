import { cookies } from 'next/headers';
import type { ReactNode } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { Sidebar } from '@/components/layout/Sidebar';
import { ToastProvider } from '@/components/ui/Toast';
import { parseSidebarExpanded, SIDEBAR_COOKIE } from '@/lib/layout-prefs';
import { mockProjects } from '@/lib/mock/projects';
import { MOCK_USER } from '@/lib/mock/user';

// Shell de las páginas privadas. El guard de sesión y el usuario real llegan con auth;
// hasta entonces se usa MOCK_USER.
export default async function AppLayout({ children }: { children: ReactNode }) {
  const expanded = parseSidebarExpanded((await cookies()).get(SIDEBAR_COOKIE)?.value);
  const activeCount = mockProjects().filter((p) => p.status !== 'archivado').length;

  return (
    <ToastProvider aboveNav>
      <div className="flex min-h-screen">
        <Sidebar user={MOCK_USER} activeCount={activeCount} initialExpanded={expanded} />
        {/* Export: 60px abajo en desktop; en mobile, 96px para no quedar bajo la BottomNav. */}
        <main className="flex min-w-0 flex-1 flex-col px-page pb-[calc(96px+env(safe-area-inset-bottom))] pt-4 shell:pb-[calc(var(--space-8)+var(--space-4))]">
          <AppHeader />
          {children}
        </main>
      </div>
      <BottomNav />
    </ToastProvider>
  );
}
