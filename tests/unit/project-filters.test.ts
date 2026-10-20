import {
  ALL,
  filterProjects,
  filtersQuery,
  hasActiveFilters,
  NO_FILTERS,
  parseProjectFilters,
  type ProjectFilters,
} from '@/lib/project-filters';
import { mockProjects } from '../fixtures/projects';

const projects = mockProjects(new Date(2026, 9, 5));
const ids = (filters: Partial<ProjectFilters>) =>
  filterProjects(projects, { ...NO_FILTERS, ...filters }).filtered.map((p) => p.id);

describe('parseProjectFilters', () => {
  it('sin parámetros no filtra nada', () => {
    expect(parseProjectFilters({})).toEqual(NO_FILTERS);
    expect(hasActiveFilters(parseProjectFilters({}))).toBe(false);
  });

  it('lee los cuatro filtros y recorta espacios', () => {
    expect(
      parseProjectFilters({ q: '  agb ', estado: 'revision', stack: 'Vercel', cms: 'Sin CMS' }),
    ).toEqual({ q: 'agb', estado: 'revision', stack: 'Vercel', cms: 'Sin CMS' });
  });

  it('un estado inválido o un parámetro repetido quedan en "todos"', () => {
    expect(parseProjectFilters({ estado: 'borrado' }).estado).toBe(ALL);
    expect(parseProjectFilters({ estado: ['revision', 'produccion'] }).estado).toBe(ALL);
    expect(parseProjectFilters({ q: ['a', 'b'] }).q).toBe('');
  });

  it('la búsqueda se corta en 100 caracteres', () => {
    expect(parseProjectFilters({ q: 'x'.repeat(500) }).q).toHaveLength(100);
  });
});

describe('filterProjects', () => {
  it('busca en nombre, cliente y código, sin importar mayúsculas ni tildes', () => {
    expect(ids({ q: 'agb' })).toEqual(['agb']);
    expect(ids({ q: 'AGENCIAWEB' })).toEqual(['agw']);
    expect(ids({ q: 'clinica' })).toEqual(['snd']);
    expect(ids({ q: 'no-existe' })).toEqual([]);
  });

  it('filtra por estado, por tecnología de cualquier capa y por CMS', () => {
    expect(ids({ estado: 'revision' })).toEqual(['plv']);
    expect(ids({ stack: 'Spring Boot' })).toEqual(['snd']);
    expect(ids({ stack: 'Vercel' })).toEqual(['agb', 'agw', 'snd', 'plv', 'alq']);
    expect(ids({ cms: 'Sin CMS' })).toEqual(['dfl', 'snd', 'alq']);
  });

  it('combina los filtros', () => {
    expect(ids({ stack: 'Vercel', cms: 'Sin CMS' })).toEqual(['snd', 'alq']);
    expect(ids({ stack: 'Vercel', cms: 'Sin CMS', estado: 'revision' })).toEqual([]);
  });

  it('los contadores por estado aplican los demás filtros, pero no el estado', () => {
    const { counts } = filterProjects(projects, {
      ...NO_FILTERS,
      estado: 'revision',
      cms: 'Sin CMS',
    });
    expect(counts).toEqual({
      [ALL]: 3,
      en_desarrollo: 3,
      revision: 0,
      produccion: 0,
      mantenimiento: 0,
      archivado: 0,
    });
  });

  it('las opciones salen de todos los proyectos, sin repetir y en orden', () => {
    const { stackOptions, cmsOptions } = filterProjects(projects, { ...NO_FILTERS, q: 'agb' });
    expect(stackOptions).toContain('Spring Boot');
    expect(stackOptions.filter((t) => t === 'Vercel')).toHaveLength(1);
    expect(stackOptions).toEqual(
      [...stackOptions].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' })),
    );
    expect(cmsOptions).toEqual(['Medusa Admin', 'Sanity', 'Sin CMS', 'Strapi 5']);
  });
});

describe('filtersQuery', () => {
  it('omite los valores por defecto', () => {
    expect(filtersQuery(NO_FILTERS)).toBe('');
    expect(filtersQuery(NO_FILTERS, 'tarjetas')).toBe('');
    expect(filtersQuery(NO_FILTERS, 'tabla')).toBe('?vista=tabla');
  });

  it('codifica los valores y se puede volver a leer', () => {
    const filters: ProjectFilters = {
      q: 'polera & co',
      estado: 'revision',
      stack: 'Next.js',
      cms: 'Sin CMS',
    };
    const query = filtersQuery(filters, 'tabla');
    expect(query).toBe('?q=polera+%26+co&estado=revision&stack=Next.js&cms=Sin+CMS&vista=tabla');
    expect(parseProjectFilters(Object.fromEntries(new URLSearchParams(query)))).toEqual(filters);
  });
});
