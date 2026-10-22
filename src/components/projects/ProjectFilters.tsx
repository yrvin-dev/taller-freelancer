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
//
// Los filtros aplicados viven aquí y no solo en `value`: las props llegan recién cuando
// responde el servidor, y armar la URL siguiente con ellas perdía un filtro si el usuario
// cambiaba otro antes (T22). `value` manda solo cuando la URL cambia desde afuera.
export function ProjectFilters({
  value,
  view,
  counts,
  stackOptions,
  cmsOptions,
}: ProjectFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [applied, setApplied] = useState(value);
  const appliedRef = useRef(value); // lo lee el temporizador del debounce (sin cierre viejo)
  const [query, setQuery] = useState(value.q);
  /** URLs pedidas que todavía no llegaron como `value`, de la más vieja a la más nueva. */
  const requested = useRef<string[]>([]);

  const apply = (next: Filters) => {
    appliedRef.current = next;
    setApplied(next);
  };

  const go = (next: Filters) => {
    apply(next);
    requested.current.push(filtersQuery(next));
    router.replace(`${pathname}${filtersQuery(next, view)}`, { scroll: false });
  };

  // Llegó una URL nueva. Si la pedimos nosotros, ya está aplicada (y las anteriores,
  // también). Si no (sidebar, "Limpiar filtros" del vacío), la URL manda.
  const valueKey = filtersQuery(value);
  useEffect(() => {
    const index = requested.current.indexOf(valueKey);
    if (index !== -1) {
      requested.current = requested.current.slice(index + 1);
      return;
    }
    requested.current = [];
    apply(value);
    setQuery(value.q);
    // `value` cambia de identidad en cada render; lo que importa es su URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valueKey]);

  // Debounce: solo se escribe en la URL cuando se deja de teclear.
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed === appliedRef.current.q) return;
    const timer = setTimeout(() => go({ ...appliedRef.current, q: trimmed }), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // `go` cambia en cada render; el efecto depende solo de lo que se teclea.
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
          value={applied.estado}
          onChange={(e) =>
            go({ ...appliedRef.current, estado: e.target.value as Filters['estado'] })
          }
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
        <Select
          value={applied.stack}
          onChange={(e) => go({ ...appliedRef.current, stack: e.target.value })}
        >
          <option value={ALL}>Todos</option>
          {stackOptions.map((tech) => (
            <option key={tech} value={tech}>
              {tech}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="CMS" htmlFor="filtro-cms" className="flex-[0_1_220px]">
        <Select
          value={applied.cms}
          onChange={(e) => go({ ...appliedRef.current, cms: e.target.value })}
        >
          <option value={ALL}>Todos</option>
          {cmsOptions.map((cms) => (
            <option key={cms} value={cms}>
              {cms}
            </option>
          ))}
        </Select>
      </Field>
      {hasActiveFilters(applied) && (
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
