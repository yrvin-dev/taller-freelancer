'use client';

import { useRef, useState } from 'react';
import { savePreferences } from '@/app/(app)/cuenta/actions';
import { useActionFeedback } from '@/components/ActionFeedback';
import { useTheme } from '@/components/ThemeProvider';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Seg } from '@/components/ui/Seg';
import { useToast } from '@/components/ui/Toast';
import type { Theme } from '@/lib/theme';

type Prefs = { displayName: string; basePath: string };

/**
 * Preferencias de "06 Cuenta". Como el export, sin botón: cada campo se guarda al
 * salir de él (si cambió). El tema se aplica al instante con la cookie (T06).
 */
export function PreferencesForm({ initial }: { initial: Prefs }) {
  const toast = useToast();
  const { fail } = useActionFeedback();
  const { theme, setTheme } = useTheme();
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof Prefs, string>>>({});
  const saved = useRef(initial);

  async function saveOnBlur(field: keyof Prefs) {
    if (values[field] === saved.current[field]) return;
    const result = await savePreferences(values);
    if (!result.ok) {
      if (result.code === 'unauthorized') fail(result);
      else setErrors({ [field]: result.fieldErrors?.[field] ?? result.error });
      return;
    }
    setErrors({});
    saved.current = values;
    toast.show(
      result.data.persisted ? 'Preferencias guardadas' : 'Se guardará al conectar la base de datos',
      result.data.persisted ? 'success' : 'info',
    );
  }

  const change = (field: keyof Prefs) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="flex flex-col gap-4">
      <Field label="Nombre para el saludo" htmlFor="pref-name" error={errors.displayName}>
        <Input
          value={values.displayName}
          onChange={change('displayName')}
          onBlur={() => saveOnBlur('displayName')}
          autoComplete="nickname"
        />
      </Field>
      <Field label="Carpeta base de proyectos" htmlFor="pref-path" error={errors.basePath}>
        <Input
          value={values.basePath}
          onChange={change('basePath')}
          onBlur={() => saveOnBlur('basePath')}
          placeholder="D:\Proyectos"
        />
      </Field>
      <div className="flex flex-col">
        <span id="pref-theme" className="mb-1 text-xs text-label">
          Tema
        </span>
        <div>
          <Seg<Theme>
            name="theme-set"
            label="Tema"
            value={theme}
            options={[
              { value: 'light', label: 'Claro', icon: 'sun' },
              { value: 'dark', label: 'Oscuro', icon: 'moon' },
            ]}
            onChange={setTheme}
          />
        </div>
      </div>
    </div>
  );
}
