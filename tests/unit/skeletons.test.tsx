import { readFileSync } from 'node:fs';
import { render, screen } from '@testing-library/react';
import type { ComponentType } from 'react';
import HomeLoading from '@/app/(app)/(inicio)/loading';
import CalendarLoading from '@/app/(app)/calendario/loading';
import AccountLoading from '@/app/(app)/cuenta/loading';
import EditLoading from '@/app/(app)/proyectos/[id]/editar/loading';
import NewLoading from '@/app/(app)/proyectos/nuevo/loading';
import { ThemeProvider } from '@/components/ThemeProvider';

const cases: [string, ComponentType, string, string | null][] = [
  ['inicio', HomeLoading, 'Cargando el inicio…', null],
  ['nuevo', NewLoading, 'Cargando el formulario…', null],
  ['editar', EditLoading, 'Cargando el formulario…', null],
  ['calendario', CalendarLoading, 'Cargando el calendario…', 'Calendario'],
  ['cuenta', AccountLoading, 'Cargando tu cuenta…', 'Cuenta'],
];

describe('loading.tsx', () => {
  it.each(cases)(
    '%s: anuncia la carga una vez y los bloques son decorativos',
    (_, Loading, label, title) => {
      const { container } = render(
        <ThemeProvider initialTheme="light">
          <Loading />
        </ThemeProvider>,
      );
      expect(screen.getByRole('status')).toHaveTextContent(label);
      expect(container.firstElementChild).toHaveAttribute('aria-busy', 'true');

      const blocks = container.querySelectorAll('.skeleton');
      expect(blocks.length).toBeGreaterThan(3);
      blocks.forEach((block) => expect(block).toHaveAttribute('aria-hidden', 'true'));

      // Los títulos fijos se muestran de verdad (no saltan al llegar los datos).
      if (title) expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument();
    },
  );

  it('el pulso se apaga con prefers-reduced-motion', () => {
    const css = readFileSync('src/styles/globals.css', 'utf8');
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\) \{\s*\.skeleton \{\s*animation: none;/,
    );
  });
});
