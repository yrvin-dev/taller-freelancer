import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tag } from '@/components/ui/Tag';
import { todayIn } from '@/lib/format';
import { listProjects } from '@/lib/data/projects';
import { agendaEvents, type AgendaKind } from '@/lib/summary';

export const metadata: Metadata = { title: 'Calendario · Taller Freelancer' };

const KIND_LABEL: Record<AgendaKind, string> = {
  entrega: 'Entrega',
  dominio: 'Dominio',
  hosting: 'Hosting',
};

// Portada de "05 Calendario": agenda por mes desde hoy. Datos de prueba hasta la
// tanda de datos (entonces `listDeadlines(uid, month)`).
export default async function CalendarPage() {
  const today = todayIn();
  const months = agendaEvents(await listProjects(), today);

  return (
    <div className="flex max-w-[820px] flex-col gap-6">
      <PageHeader
        title="Calendario"
        description="Entregas y vencimientos de dominio y hosting, en orden."
      />

      {months.length === 0 ? (
        <p className="m-0 text-neutral-700">No hay entregas ni vencimientos próximos.</p>
      ) : (
        months.map((month) => (
          <section
            key={month.key}
            aria-labelledby={`mes-${month.key}`}
            className="flex flex-col gap-1"
          >
            <h2 id={`mes-${month.key}`} className="m-0 mb-2 text-2xl">
              {month.label}
            </h2>
            <ul className="m-0 flex list-none flex-col p-0">
              {month.events.map((event) => (
                <li key={event.id}>
                  <Link
                    href={`/proyectos/${event.projectId}`}
                    className="-mx-[calc(var(--space-1)*1.2)] flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md px-[calc(var(--space-1)*1.2)] py-2 text-text no-underline hover:bg-state-hover hover:text-text"
                  >
                    <span className="flex w-[56px] flex-col leading-[1.05]">
                      <span className="font-heading text-[28px] font-semibold">{event.day}</span>
                      <span className="text-xs text-neutral-700">{event.weekday}</span>
                    </span>
                    <span className="flex min-w-0 flex-[1_1_220px] flex-col leading-[1.3]">
                      <span className="text-lg font-semibold">{event.title}</span>
                      <span className="text-sm text-neutral-700">{event.detail}</span>
                    </span>
                    <Tag tone={event.tone}>{KIND_LABEL[event.kind]}</Tag>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
