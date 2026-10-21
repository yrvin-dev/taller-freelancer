import { toISODate } from '@/lib/format';
import type { Project } from '@/lib/projects';
import { PaymentsPanel } from './PaymentsPanel';

// Pestaña "Pagos" del export: Monto total · Pagado · Saldo, barra de cobro (degradado
// n.º 3) y la lista de pagos parciales (02 §8.3). Al cliente solo viaja lo necesario
// (no el proyecto entero); la key reinicia el panel al cambiar de proyecto.
export function PaymentsTab({ project, today }: { project: Project; today: Date }) {
  return (
    <PaymentsPanel
      key={project.id}
      projectId={project.id}
      budgetPen={project.budgetPen}
      initialPayments={project.payments}
      today={toISODate(today)}
    />
  );
}
