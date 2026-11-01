'use client';

import { useState, useTransition } from 'react';
import { saveReminders, sendTestReminder } from '@/app/(app)/cuenta/actions';
import { useActionFeedback } from '@/components/ActionFeedback';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Seg } from '@/components/ui/Seg';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { REMINDER_DAYS_OPTIONS, type ReminderDays } from '@/lib/domain';
import type { ReminderPrefs } from '@/lib/schemas';

/**
 * Recordatorios por correo en Cuenta (02 §8.12, T30a). Como el resto de Preferencias,
 * cada cambio se guarda al instante; si falla, vuelve al valor guardado. Con los
 * recordatorios activados se puede pedir un correo de prueba (T30b).
 */
export function ReminderSettings({ initial, email }: { initial: ReminderPrefs; email: string }) {
  const toast = useToast();
  const { fail } = useActionFeedback();
  const [prefs, setPrefs] = useState(initial);
  const [sending, startSending] = useTransition();

  function sendTest() {
    startSending(async () => {
      const result = await sendTestReminder();
      if (!result.ok) return fail(result);
      toast.show(`Te enviamos un correo de prueba a ${email}`, 'success');
    });
  }

  async function save(next: ReminderPrefs, message: string) {
    const previous = prefs;
    setPrefs(next);
    const result = await saveReminders(next);
    if (!result.ok) {
      setPrefs(previous);
      fail(result);
      return;
    }
    toast.show(message, 'success');
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="m-0 text-md text-neutral-700">
        Te escribimos a <strong className="text-text">{email}</strong> cuando se acerca una entrega
        o vence un dominio o un hosting. Un solo correo al día, y solo si hay algo que avisar.
      </p>
      <div className="flex flex-col">
        <span className="mb-1 text-xs text-label">Recordatorios por correo</span>
        <div>
          <Seg<'on' | 'off'>
            name="reminders"
            label="Recordatorios por correo"
            value={prefs.enabled ? 'on' : 'off'}
            options={[
              { value: 'off', label: 'Desactivados' },
              { value: 'on', label: 'Activados' },
            ]}
            onChange={(value) =>
              save(
                { ...prefs, enabled: value === 'on' },
                value === 'on' ? 'Recordatorios activados' : 'Recordatorios desactivados',
              )
            }
          />
        </div>
      </div>
      {prefs.enabled && (
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-full max-w-[260px]">
            <Field label="Avisarme con" htmlFor="reminder-days">
              <Select
                value={String(prefs.days)}
                onChange={(e) =>
                  save(
                    { ...prefs, days: Number(e.target.value) as ReminderDays },
                    'Anticipación guardada',
                  )
                }
              >
                {REMINDER_DAYS_OPTIONS.map((days) => (
                  <option key={days} value={days}>
                    {days} días de anticipación
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Button variant="secondary" loading={sending} onClick={sendTest}>
            {sending ? 'Enviando…' : 'Enviar correo de prueba'}
          </Button>
        </div>
      )}
    </div>
  );
}
