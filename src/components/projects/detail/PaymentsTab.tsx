import { cx } from '@/lib/cx';
import { formatDate, formatPEN } from '@/lib/format';
import { paidPen, type Project } from '@/lib/projects';

// Pestaña "Pagos" del export: Monto total · Pagado · Saldo, barra de cobro (degradado
// n.º 3) y la lista de pagos parciales (02 §8.3).
export function PaymentsTab({ project }: { project: Project }) {
  const budget = project.budgetPen;
  const paid = paidPen(project);
  const balance = budget === null ? 0 : Math.round((budget - paid) * 100) / 100;
  const pct = budget ? Math.min(100, Math.round((paid / budget) * 100)) : 0;

  const figures =
    budget === null
      ? [{ label: 'Monto total', value: 'Sin registrar', className: 'text-neutral-700' }]
      : [
          { label: 'Monto total', value: formatPEN(budget), className: 'text-text' },
          { label: 'Pagado', value: formatPEN(paid), className: 'text-text' },
          {
            label: 'Saldo',
            value: formatPEN(balance),
            className: balance > 0 ? 'text-accent-2-700' : 'text-text',
          },
        ];

  return (
    <div className="flex max-w-[820px] flex-col gap-6">
      <dl className="m-0 flex flex-wrap gap-x-8 gap-y-6">
        {figures.map((figure) => (
          <div key={figure.label} className="flex flex-col gap-1">
            <dt className="text-xs uppercase tracking-caps text-neutral-700">{figure.label}</dt>
            <dd
              className={cx(
                'm-0 font-heading text-[40px] font-semibold leading-none tracking-[-0.02em]',
                figure.className,
              )}
            >
              {figure.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-col gap-2">
        <div
          role="progressbar"
          aria-label="Cobrado"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          className="h-[8px] overflow-hidden rounded-md bg-neutral-200"
        >
          <div className="h-full rounded-md bg-progress" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-sm text-neutral-700">
          {budget === null ? 'Registra el monto desde Editar.' : `${pct}% cobrado · soles (PEN)`}
        </span>
      </div>

      {budget !== null && (
        <section className="flex flex-col gap-2" aria-labelledby="pagos-lista">
          <h2 id="pagos-lista" className="m-0 text-xl">
            Pagos
          </h2>
          {project.payments.length > 0 ? (
            <ul className="m-0 flex list-none flex-col p-0">
              {project.payments.map((payment) => (
                <li key={payment.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-3">
                  <span className="flex-[0_0_120px] text-sm text-neutral-700">
                    {formatDate(payment.paidOn)}
                  </span>
                  <span className="flex-1">{payment.concept ?? 'Pago'}</span>
                  <span className="font-semibold">{formatPEN(payment.amountPen)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 text-neutral-700">Aún no hay pagos registrados.</p>
          )}
        </section>
      )}
    </div>
  );
}
