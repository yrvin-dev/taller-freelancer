'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { PROJECT_STATUSES, STATUS_META } from '@/lib/domain';
import {
  ALL,
  filtersQuery,
  hasActiveFilters,
  NO_FILTERS,
  type FilterResult,
  type ProjectFilters as Filters,
} from '@/lib/project-filters';
import type { ProjectView } from '@/lib/projects';

/** Espera tras la última tecla antes de escribir la búsqueda en la URL. */
export const SEARCH_DEBOUNCE_MS = 300;

export type ProjectFiltersProps = {
  value: Filters;
  view: ProjectView;
} & Pick<FilterResult, 'counts' | 'stackOptions' | 'cmsOptions'>;

// Fila de filtros de "02 Proyectos" (export) + el campo Buscar (02 §8.7: en mobile no
// hay sidebar). Todo escribe en la URL con `replace` (sin llenar el historial).
export function ProjectFilters({
  value,
  view,
  counts,
  stackOptions,
  cmsOptions,
}: ProjectFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(value.q);
  const lastSent = useRef(value.q);

  const go = (next: Filters) =>
    router.replace(`${pathname}${filtersQuery(next, view)}`, { scroll: false });

  // La URL manda: "Limpiar filtros" o la búsqueda de la sidebar cambian `value.q`.
  useEffect(() => {
    setQuery(value.q);
    lastSent.current = value.q;
  }, [value.q]);

  // Debounce: solo se escribe en la URL cuando se deja de teclear.
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed === lastSent.current) return;
    const timer = setTimeout(() => {
      lastSent.current = trimmed;
      go({ ...value, q: trimmed });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // `go` y `value` cambian en cada render; el efecto depende solo de lo que se teclea.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="flex flex-wrap gap-3">
      <Field label="Buscar" htmlFor="filtro-q" className="flex-[1_1_220px]">
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nombre, cliente o código"
          autoComplete="off"
          maxLength={100}
        />
      </Field>
      <Field label="Estado" htmlFor="filtro-estado" className="flex-[0_1_220px]">
        <Select
          value={value.estado}
          onChange={(e) => go({ ...value, estado: e.target.value as Filters['estado'] })}
        >
          <option value={ALL}>Todos ({counts[ALL]})</option>
          {PROJECT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_META[status].label} ({counts[status]})
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Stack" htmlFor="filtro-stack" className="flex-[0_1_220px]">
        <Select value={value.stack} onChange={(e) => go({ ...value, stack: e.target.value })}>
          <option value={ALL}>Todos</option>
          {stackOptions.map((tech) => (
            <option key={tech} value={tech}>
              {tech}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="CMS" htmlFor="filtro-cms" className="flex-[0_1_220px]">
        <Select value={value.cms} onChange={(e) => go({ ...value, cms: e.target.value })}>
          <option value={ALL}>Todos</option>
          {cmsOptions.map((cms) => (
            <option key={cms} value={cms}>
              {cms}
            </option>
          ))}
        </Select>
      </Field>
      {hasActiveFilters(value) && (
        <Button
          variant="ghost"
          icon="close"
          className="mb-[2px] self-end"
          onClick={() => go(NO_FILTERS)}
        >
          Limpiar filtros
        </Button>
      )}
    </div>
  );
}
