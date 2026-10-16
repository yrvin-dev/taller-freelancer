import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { buttonClass } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { formatPEN, formatRelativeDays, greeting } from '@/lib/format';
import type { Project } from '@/lib/projects';
import {
  expiringSoon,
  expiryTone,
  homeSummaryLine,
  pendingPayments,
  recentProjects,
  totalBalance,
  upcomingDeliveries,
} from '@/lib/summary';
import { HomeEmptyState } from './HomeEmptyState';
import { RecentProjects } from './RecentProjects';
import { SummaryCard, type SummaryCardProps } from './SummaryCard';

const ITEMS_PER_CARD = 3;
const hrefOf = (project: Project) => `/proyectos/${project.id}`;
const whole = (amount: number) => formatPEN(amount, { whole: true });

/** Las 3 cards del export, con los badges calculados desde los datos. */
export function homeCards(projects: Project[], today: Date): SummaryCardProps[] {
  const upcoming = upcomingDeliveries(projects, today);
  const expiring = expiringSoon(projects, today);
  const owing = pendingPayments(projects);

  return [
    {
      title: 'Entregas próximas',
      icon: 'deploy',
      iconTone: 'featured',
      featured: true,
      window: 'Por fecha',
      count: upcoming.length,
      sub: upcoming.length === 1 ? 'proyecto' : 'proyectos',
      items: upcoming.slice(0, ITEMS_PER_CARD).map(({ project, days }) => ({
        id: project.id,
        href: hrefOf(project),
        primary: project.name,
        badge: formatRelativeDays(days),
        tone: 'accent',
      })),
    },
    {
      title: 'Por vencer',
      icon: 'alarm',
      iconTone: 'danger',
      window: 'Próximos 30 días',
      count: expiring.length,
      sub: 'dominios y hosting',
      items: expiring.slice(0, ITEMS_PER_CARD).map((expiry) => ({
        id: `${expiry.project.id}-${expiry.kind}`,
        href: hrefOf(expiry.project),
        primary: `${expiry.kind === 'dominio' ? 'Dominio' : 'Hosting'} · ${expiry.project.name}`,
        badge: expiry.pending ? 'Comprar' : formatRelativeDays(expiry.days),
        tone: expiryTone(expiry),
      })),
    },
    {
      title: 'Pagos pendientes',
      icon: 'payment',
      iconTone: 'yellow',
      window: 'Saldos',
      count: owing.length,
      sub: whole(totalBalance(owing)),
      items: owing.slice(0, ITEMS_PER_CARD).map(({ project, paid, budget, balance }) => ({
        id: project.id,
        href: hrefOf(project),
        primary: project.name,
        secondary: `Adelanto ${whole(paid)} de ${whole(budget)}`,
        badge: whole(balance),
        tone: 'neutral',
      })),
    },
  ];
}

export type HomeDashboardProps = {
  projects: Project[];
  /** "Hoy" en Lima (`todayIn()`); se inyecta para que los tests fijen la fecha. */
  today: Date;
  /** Hora en Lima, para el saludo. */
  hour: number;
  userName: string;
};

// Portada de "01 Inicio" del export.
export function HomeDashboard({ projects, today, hour, userName }: HomeDashboardProps) {
  const firstName = userName.trim().split(/\s+/)[0] ?? userName;
  const empty = projects.length === 0;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={`${greeting(hour)}, ${firstName}`}
        description={empty ? undefined : homeSummaryLine(projects)}
        actions={
          <Link href="/proyectos/nuevo" className={buttonClass()}>
            <Icon name="plus" />
            Nuevo proyecto
          </Link>
        }
      />

      {empty ? (
        <HomeEmptyState />
      ) : (
        <>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(270px,1fr))] gap-4">
            {homeCards(projects, today).map((card) => (
              <SummaryCard key={card.title} {...card} />
            ))}
          </div>
          <RecentProjects projects={recentProjects(projects)} />
        </>
      )}
    </div>
  );
}
