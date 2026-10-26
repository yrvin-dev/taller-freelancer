'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useTransition } from 'react';
import { useForm, type FieldPath } from 'react-hook-form';
import { removeThumbnail, saveThumbnail } from '@/app/(app)/proyectos/[id]/actions';
import { saveProject } from '@/app/(app)/proyectos/actions';
import { useActionFeedback } from '@/components/ActionFeedback';
import { Button, buttonClass } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';
import { cx } from '@/lib/cx';
import {
  CMS_OPTIONS,
  NO_CMS_LABEL,
  PROJECT_STATUSES,
  PROJECT_TYPES,
  STATUS_META,
  TYPE_LABEL,
} from '@/lib/domain';
import { projectSchema, type ProjectFormValues, type ProjectInput } from '@/lib/schemas';
import type { ThumbnailChange } from '@/lib/thumbnails';
import { ThumbnailField } from './ThumbnailField';

type FieldName = FieldPath<ProjectFormValues>;

type FieldSpec = {
  name: Exclude<FieldName, 'domainPending'>;
  label: string;
  placeholder?: string;
  hint?: string;
  kind?: 'text' | 'date' | 'email' | 'tel' | 'money' | 'area';
  options?: { value: string; label: string }[];
  wide?: boolean;
};

export type ProjectFormProps = {
  mode: 'new' | 'edit';
  /** null al crear. */
  projectId: string | null;
  title: string;
  initial: ProjectFormValues;
  thumbnailUrl: string | null;
  /** A dónde vuelven "Cancelar" y "Descartar". */
  cancelHref: string;
};

const FORM_ID = 'project-form';

function withFile(file: File): FormData {
  const data = new FormData();
  data.set('thumbnail', file);
  return data;
}

// Portado de "04 Formulario de proyecto": miniatura a la izquierda y las secciones del
// export a la derecha (Editores CMS es fase 2; Credenciales llegan con el cifrado).
// Mismo esquema que la Server Action: zodResolver valida aquí y saveProject repite
// la validación en el servidor; sus fieldErrors se pintan en los mismos campos.
export function ProjectForm({
  mode,
  projectId,
  title,
  initial,
  thumbnailUrl,
  cancelHref,
}: ProjectFormProps) {
  const toast = useToast();
  const { fail } = useActionFeedback();
  const router = useRouter();
  const [saving, startSaving] = useTransition();
  // Un ref y no estado: elegir una imagen no tiene por qué re-renderizar todo el formulario.
  const thumbnail = useRef<ThumbnailChange>(null);
  const {
    register,
    handleSubmit,
    getValues,
    setError,
    formState: { errors, submitCount },
  } = useForm<ProjectFormValues, unknown, ProjectInput>({
    resolver: zodResolver(projectSchema),
    defaultValues: initial,
    reValidateMode: 'onChange',
  });

  // El CMS es texto libre: si el proyecto usa uno fuera de la lista, se agrega.
  const cmsOptions = [
    { value: '', label: NO_CMS_LABEL },
    ...[
      ...CMS_OPTIONS,
      ...(initial.cms && !(CMS_OPTIONS as readonly string[]).includes(initial.cms)
        ? [initial.cms]
        : []),
    ].map((cms) => ({ value: cms, label: cms })),
  ];

  const sections: { title: string; fields: FieldSpec[] }[] = [
    {
      title: 'General',
      fields: [
        { name: 'name', label: 'Nombre del proyecto *', placeholder: 'Colegio AGB' },
        { name: 'code', label: 'Código', placeholder: 'AGB-2026' },
        {
          name: 'type',
          label: 'Tipo',
          options: PROJECT_TYPES.map((t) => ({ value: t, label: TYPE_LABEL[t] })),
        },
        {
          name: 'status',
          label: 'Estado',
          options: PROJECT_STATUSES.map((s) => ({ value: s, label: STATUS_META[s].label })),
        },
        { name: 'deliveryDate', label: 'Fecha de entrega', kind: 'date' },
        {
          name: 'description',
          label: 'Descripción corta',
          placeholder: 'Qué es y qué resuelve',
          kind: 'area',
          wide: true,
        },
      ],
    },
    {
      title: 'Cliente',
      fields: [
        { name: 'client', label: 'Cliente *', placeholder: 'Nombre o empresa' },
        { name: 'clientContact', label: 'Contacto' },
        { name: 'clientEmail', label: 'Correo', kind: 'email' },
        { name: 'clientWhatsapp', label: 'WhatsApp', placeholder: '+51 …', kind: 'tel' },
        { name: 'clientCountry', label: 'País' },
      ],
    },
    {
      title: 'Stack',
      fields: [
        {
          name: 'frontend',
          label: 'Frontend',
          placeholder: 'Astro, Tailwind, React',
          hint: 'Separa con comas.',
        },
        { name: 'backend', label: 'Backend', placeholder: 'Spring Boot' },
        { name: 'db', label: 'Base de datos', placeholder: 'PostgreSQL' },
        { name: 'cms', label: 'CMS', options: cmsOptions },
        { name: 'hosting', label: 'Hosting', placeholder: 'Vercel' },
      ],
    },
    {
      title: 'Accesos',
      fields: [
        { name: 'localPath', label: 'Ruta local en la PC', wide: true },
        { name: 'linkRepo', label: 'Repositorio' },
        { name: 'linkDeploy', label: 'Sitio en producción' },
        { name: 'linkCms', label: 'Link del CMS' },
        { name: 'linkDesign', label: 'Link del diseño' },
        { name: 'linkPanel', label: 'Panel de hosting' },
        { name: 'domainExpires', label: 'Vence dominio', kind: 'date' },
        { name: 'hostingExpires', label: 'Vence hosting', kind: 'date' },
      ],
    },
    {
      title: 'Pagos',
      fields: [
        { name: 'budgetPen', label: 'Monto total (S/)', kind: 'money', placeholder: '7800' },
        ...(mode === 'new'
          ? [
              {
                name: 'advancePen',
                label: 'Adelanto (S/)',
                kind: 'money',
                hint: 'Se registra como el primer pago.',
              } satisfies FieldSpec,
            ]
          : []),
      ],
    },
    ...(mode === 'new'
      ? [
          {
            title: 'Notas',
            fields: [
              {
                name: 'firstNote',
                label: 'Primera entrada de la bitácora',
                placeholder: 'Pedido inicial del cliente, acuerdos…',
                kind: 'area',
                wide: true,
              } satisfies FieldSpec,
            ],
          },
        ]
      : []),
  ];

  // `handleSubmit` valida en el cliente; el servidor recibe los valores crudos y los
  // vuelve a validar (nunca se confía en lo que manda el navegador).
  const submit = handleSubmit(() => {
    startSaving(async () => {
      const result = await saveProject(getValues(), projectId);
      if (!result.ok) {
        for (const [name, message] of Object.entries(result.fieldErrors ?? {})) {
          setError(name as FieldName, { type: 'server', message }, { shouldFocus: true });
        }
        fail(result);
        return;
      }
      const id = result.data.id;
      // La miniatura va después, con el proyecto ya guardado (y creado, si es nuevo).
      const change = thumbnail.current;
      const thumbResult =
        change === null
          ? null
          : change === 'remove'
            ? await removeThumbnail(id)
            : await saveThumbnail(id, withFile(change.file));
      if (thumbResult && !thumbResult.ok) {
        // El proyecto sí se guardó: se va a la ficha igual, con el error de la miniatura.
        fail(thumbResult);
        if (thumbResult.code !== 'unauthorized') router.push(`/proyectos/${id}`);
        return;
      }
      // El toast vive en el layout (app): sobrevive a la navegación a la ficha.
      toast.show(mode === 'new' ? 'Proyecto creado' : 'Cambios guardados');
      router.push(`/proyectos/${id}`);
    });
  });

  const hasErrors = submitCount > 0 && Object.keys(errors).length > 0;

  function renderControl(spec: FieldSpec) {
    const control = register(spec.name);
    if (spec.options) {
      return (
        <Select {...control}>
          {spec.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      );
    }
    if (spec.kind === 'area') return <Textarea {...control} placeholder={spec.placeholder} />;
    const type = spec.kind === 'money' || !spec.kind ? 'text' : spec.kind;
    return (
      <Input
        {...control}
        type={type}
        placeholder={spec.placeholder}
        inputMode={spec.kind === 'money' ? 'decimal' : undefined}
        autoComplete="off"
      />
    );
  }

  const actions = (
    <>
      <Link href={cancelHref} className={buttonClass({ variant: 'secondary' })}>
        Descartar
      </Link>
      <Button type="submit" form={FORM_ID} icon="check" loading={saving}>
        {saving ? 'Guardando…' : 'Guardar proyecto'}
      </Button>
    </>
  );

  return (
    <section className="flex flex-col gap-6" aria-labelledby="form-titulo">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-[1_1_300px]">
          <Link href={cancelHref} className={cx(buttonClass({ variant: 'ghost' }), 'mb-2')}>
            <Icon name="back" />
            Cancelar
          </Link>
          <h1 id="form-titulo" className="m-0">
            {title}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">{actions}</div>
      </div>

      {hasErrors && (
        <p
          role="alert"
          className="m-0 self-start rounded-pill bg-accent-2-100 px-3 py-[calc(var(--space-1)*1.2)] text-sm text-accent-2-800"
        >
          Revisa los campos marcados.
        </p>
      )}

      <div className="flex flex-wrap items-start gap-8">
        <div className="max-w-[360px] flex-[1_1_260px]">
          <ThumbnailField
            initialUrl={thumbnailUrl}
            onChange={(change) => {
              thumbnail.current = change;
            }}
          />
        </div>

        <form
          id={FORM_ID}
          noValidate
          onSubmit={submit}
          className="flex flex-[3_1_420px] flex-col gap-8"
        >
          {sections.map((section) => (
            <fieldset key={section.title} className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0">
              <legend className="mb-3 p-0 font-heading text-xl font-semibold">
                {section.title}
              </legend>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-x-4 gap-y-3">
                {section.fields.map((spec) => (
                  <Field
                    key={spec.name}
                    label={spec.label}
                    htmlFor={`pf-${spec.name}`}
                    hint={spec.hint}
                    error={errors[spec.name]?.message}
                    className={spec.wide ? 'col-span-full' : undefined}
                  >
                    {renderControl(spec)}
                  </Field>
                ))}
                {section.title === 'Accesos' && (
                  <label className="col-span-full flex min-h-[44px] cursor-pointer items-center gap-2 text-md">
                    <input
                      type="checkbox"
                      {...register('domainPending')}
                      className="h-[18px] w-[18px] accent-accent"
                    />
                    Dominio por comprar
                  </label>
                )}
              </div>
            </fieldset>
          ))}

          <div className="flex flex-wrap gap-2">{actions}</div>
        </form>
      </div>
    </section>
  );
}
