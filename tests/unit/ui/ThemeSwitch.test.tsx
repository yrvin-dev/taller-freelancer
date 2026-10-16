import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider, useTheme } from '@/components/ThemeProvider';
import { ThemeSwitch } from '@/components/ui/ThemeSwitch';
import { THEME_COOKIE } from '@/lib/theme';

function ConnectedSwitch() {
  const { theme, toggle } = useTheme();
  return <ThemeSwitch theme={theme} onToggle={toggle} />;
}

describe('ThemeSwitch', () => {
  it('es un switch accesible: encendido = modo oscuro', () => {
    const { rerender } = render(<ThemeSwitch theme="light" onToggle={vi.fn()} />);
    const sw = screen.getByRole('switch', { name: 'Modo oscuro' });
    expect(sw).toHaveAttribute('aria-checked', 'false');
    rerender(<ThemeSwitch theme="dark" onToggle={vi.fn()} />);
    expect(sw).toHaveAttribute('aria-checked', 'true');
  });

  it('dibuja con tokens, sin colores fijos', () => {
    const { container } = render(<ThemeSwitch theme="dark" onToggle={vi.fn()} size="sm" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '38');
    expect(container.innerHTML).toContain('var(--switch-dark-track)');
    expect(container.innerHTML).not.toMatch(/#[0-9a-f]{3,6}\b/i);
  });

  it('llama a onToggle al hacer clic', () => {
    const onToggle = vi.fn();
    render(<ThemeSwitch theme="light" onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});

describe('ThemeProvider', () => {
  beforeEach(() => {
    document.documentElement.dataset.theme = 'light';
    document.cookie = `${THEME_COOKIE}=; Max-Age=0; Path=/`;
  });

  it('al alternar cambia data-theme en <html> y guarda la cookie', () => {
    render(
      <ThemeProvider initialTheme="light">
        <ConnectedSwitch />
      </ThemeProvider>,
    );
    const sw = screen.getByRole('switch');

    fireEvent.click(sw);
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.cookie).toContain(`${THEME_COOKIE}=dark`);
    expect(sw).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(sw);
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(document.cookie).toContain(`${THEME_COOKIE}=light`);
  });

  it('useTheme fuera del provider falla con un mensaje claro', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<ConnectedSwitch />)).toThrow(/ThemeProvider/);
    spy.mockRestore();
  });
});
