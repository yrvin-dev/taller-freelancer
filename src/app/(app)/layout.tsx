import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { Sidebar } from '@/components/layout/Sidebar';
import { ToastProvider } from '@/components/ui/Toast';
import { parseSidebarExpanded, SIDEBAR_COOKIE } from '@/lib/layout-prefs';
import { listProjects } from '@/lib/data/projects';
import { getCurrentProfile } from '@/lib/data/profile';

// Shell de las páginas privadas con el usuario de la sesión. El middleware ya
// redirige sin sesión; esto es la segunda barrera (y la que da el perfil).
export default async function AppLayout({ children }: { children: ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');

  const expanded = parseSidebarExpanded((await cookies()).get(SIDEBAR_COOKIE)?.value);
  // listProjects va con cache(): la página del mismo pedido reusa esta lectura.
  const activeCount = (await listProjects()).filter((p) => p.status !== 'archivado').length;

  return (
    <ToastProvider aboveNav>
      <div className="flex min-h-screen">
        <Sidebar user={profile} activeCount={activeCount} initialExpanded={expanded} />
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
