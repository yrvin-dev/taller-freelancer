import { render, screen } from '@testing-library/react';
import { StatusDot } from '@/components/ui/StatusDot';
import { Tag } from '@/components/ui/Tag';

describe('Tag', () => {
  it('es neutral por defecto y en pill', () => {
    render(<Tag>Astro</Tag>);
    expect(screen.getByText('Astro')).toHaveClass(
      'rounded-pill',
      'bg-neutral-100',
      'text-neutral-800',
    );
  });

  it.each([
    ['accent', 'bg-accent-100'],
    ['accent-2', 'bg-accent-2-100'],
    ['outline', 'border-accent'],
  ] as const)('tono %s', (tone, expected) => {
    render(<Tag tone={tone}>x</Tag>);
    expect(screen.getByText('x')).toHaveClass(expected);
  });
});

describe('StatusDot', () => {
  it('muestra el label del estado con el color de su token', () => {
    const { container } = render(<StatusDot status="mantenimiento" />);
    expect(screen.getByText('Mantenimiento')).toHaveClass('bg-neutral-100');
    const dot = container.querySelector('[aria-hidden="true"]');
    // `toHaveStyle` usa getComputedStyle, y jsdom no resuelve `background` con var():
    // se compara el estilo escrito (CLAUDE.md, gotcha de T25).
    expect(dot).toHaveAttribute('style', 'background: var(--status-maint);');
  });

  it('"En desarrollo" usa el tono de acento', () => {
    render(<StatusDot status="en_desarrollo" />);
    expect(screen.getByText('En desarrollo')).toHaveClass('bg-accent-100');
  });
});
