'use client';

import { useOptimistic, useRef, useState, useTransition, type FormEvent } from 'react';
import { addPayment, deletePayment } from '@/app/(app)/proyectos/[id]/actions';
import { useActionFeedback } from '@/components/ActionFeedback';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { cx } from '@/lib/cx';
import { formatDate, formatPEN } from '@/lib/format';
import { paidPen, type Payment } from '@/lib/projects';
import { fieldErrorsOf, paymentInputSchema, type PaymentFormValues } from '@/lib/schemas';

type Row = Payment & { pending?: boolean };
type Change = { type: 'add'; payment: Row } | { type: 'delete'; id: string };

const byDate = (a: Payment, b: Payment) => a.paidOn.localeCompare(b.paidOn);

export type PaymentsPanelProps = {
  projectId: string;
  budgetPen: number | null;
  initialPayments: Payment[];
  /** Hoy en Lima (`YYYY-MM-DD`): valor inicial y máximo de la fecha. */
  today: string;
};

/**
 * Cifras, barra y lista de la pestaña Pagos (02 §8.3), con "Registrar pago" y borrar
 * con confirmación en la línea. Optimista: el pago aparece (o desaparece) y las cifras
 * se recalculan al instante; si la acción falla, `useOptimistic` lo revierte solo.
 */
export function PaymentsPanel({
  projectId,
  budgetPen,
  initialPayments,
  today,
}: PaymentsPanelProps) {
  const toast = useToast();
  const { fail } = useActionFeedback();
  const [payments, setPayments] = useState<Row[]>(initialPayments);
  const [rows, applyChange] = useOptimistic(payments, (current, change: Change) =>
    change.type === 'add'
      ? [...current, change.payment].sort(byDate)
      : current.filter((p) => p.id !== change.id),
  );
  const emptyForm: PaymentFormValues = { projectId, amountPen: '', paidOn: today, concept: '' };
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [asking, setAsking] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const amountRef = useRef<HTMLInputElement>(null);
  const tempId = useRef(0);

  const paid = paidPen({ payments: rows });
  const balance = budgetPen === null ? 0 : Math.round((budgetPen - paid) * 100) / 100;
  const pct = budgetPen ? Math.min(100, Math.round((paid / budgetPen) * 100)) : 0;

  const figures =
    budgetPen === null
      ? [{ label: 'Monto total', value: 'Sin registrar', className: 'text-neutral-700' }]
      : [
          { label: 'Monto total', value: formatPEN(budgetPen), className: 'text-text' },
          { label: 'Pagado', value: formatPEN(paid), className: 'text-text' },
          {
            label: 'Saldo',
            value: formatPEN(balance),
            className: balance > 0 ? 'text-accent-2-700' : 'text-text',
          },
        ];

  const change =
    (field: 'amountPen' | 'paidOn' | 'concept') => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  function add(event: FormEvent) {
    event.preventDefault();
    // Mismo esquema que la Server Action: lo inválido no viaja al servidor.
    const parsed = paymentInputSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(fieldErrorsOf(parsed.error));
      amountRef.current?.focus();
      return;
    }
    setErrors({});
    const { amountPen, paidOn, concept } = parsed.data;
    startTransition(async () => {
      tempId.current += 1;
      applyChange({
        type: 'add',
        payment: {
          id: `pendiente-${tempId.current}`,
          amountPen,
          paidOn,
          ...(concept ? { concept } : {}),
          pending: true,
        },
      });
      // Al servidor va la entrada del formulario (texto), no `parsed.data`: la acción la
      // valida de nuevo con el mismo esquema, que espera texto (como `getValues()` en RHF).
      const result = await addPayment(form);
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        fail(result);
        return;
      }
      // Tras un await, la actualización va en su propia transición: así entra junto con
      // el fin de la optimista (sin un instante con el pago duplicado).
      startTransition(() => {
        setPayments((prev) => [...prev, result.data].sort(byDate));
        setForm(emptyForm);
      });
      toast.show('Pago registrado');
    });
  }

  function remove(id: string) {
    setAsking(null);
    startTransition(async () => {
      applyChange({ type: 'delete', id });
      const result = await deletePayment(id);
      if (!result.ok) {
        fail(result);
        return;
      }
      startTransition(() => setPayments((prev) => prev.filter((p) => p.id !== id)));
      toast.show('Pago borrado');
      amountRef.current?.focus(); // el botón que tenía el foco desaparece
    });
  }

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
          {budgetPen === null ? 'Registra el monto desde Editar.' : `${pct}% cobrado · soles (PEN)`}
        </span>
      </div>

      {budgetPen !== null && (
        <section className="flex flex-col gap-3" aria-labelledby="pagos-lista">
          <h2 id="pagos-lista" className="m-0 text-xl">
            Pagos
          </h2>

          <form onSubmit={add} noValidate className="flex flex-col gap-2">
            <div className="flex flex-wrap items-start gap-3">
              <Field
                label="Monto (S/)"
                htmlFor="pago-monto"
                error={errors.amountPen}
                className="flex-[0_1_160px]"
              >
                <Input
                  ref={amountRef}
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="1500.00"
                  value={form.amountPen}
                  onChange={change('amountPen')}
                />
              </Field>
              <Field
                label="Fecha"
                htmlFor="pago-fecha"
                error={errors.paidOn}
                className="flex-[0_1_180px]"
              >
                <Input type="date" max={today} value={form.paidOn} onChange={change('paidOn')} />
              </Field>
              <Field
                label="Concepto (opcional)"
                htmlFor="pago-concepto"
                error={errors.concept}
                className="flex-[1_1_220px]"
              >
                <Input
                  placeholder="Segundo pago, saldo final…"
                  maxLength={120}
                  value={form.concept ?? ''}
                  onChange={change('concept')}
                />
              </Field>
            </div>
            <Button type="submit" icon="plus" loading={pending} className="self-start">
              Registrar pago
            </Button>
          </form>

          {rows.length > 0 ? (
            <ul className="m-0 flex list-none flex-col p-0">
              {rows.map((payment) => {
                const date = formatDate(payment.paidOn);
                const label = payment.concept ?? 'Pago';
                return (
                  <li
                    key={payment.id}
                    aria-busy={payment.pending || undefined}
                    className={cx(
                      'flex flex-wrap items-center gap-x-4 gap-y-1 py-3',
                      payment.pending && 'opacity-60',
                    )}
                  >
                    <span className="flex-[0_0_120px] text-sm text-neutral-700">{date}</span>
                    <span className="flex-1">
                      {label}
                      {payment.pending && (
                        <>
                          {' '}
                          <span className="sr-only">(guardando…)</span>
                        </>
                      )}
                    </span>
                    <span className="font-semibold">{formatPEN(payment.amountPen)}</span>
                    {payment.pending ? (
                      <span className="w-[36px] flex-none" />
                    ) : asking === payment.id ? (
                      <span className="flex flex-none items-center gap-2">
                        <span className="text-sm text-neutral-700">¿Borrar?</span>
                        <Button size="sm" variant="ghost" autoFocus onClick={() => setAsking(null)}>
                          No
                        </Button>
                        <Button size="sm" tone="danger" onClick={() => remove(payment.id)}>
                          Sí, borrar
                        </Button>
                      </span>
                    ) : (
                      <Button
                        iconOnly
                        icon="trash"
                        variant="ghost"
                        aria-label={`Borrar pago del ${date} (${label}, ${formatPEN(payment.amountPen)})`}
                        onClick={() => setAsking(payment.id)}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="m-0 text-neutral-700">Aún no hay pagos registrados.</p>
          )}
        </section>
      )}
    </div>
  );
}
