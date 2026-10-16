import { render, screen } from '@testing-library/react';
import { Avatar, initials } from '@/components/ui/Avatar';

describe('initials', () => {
  it.each([
    ['Yrvin Huamán', 'YH'],
    ['camila torres pérez', 'CT'],
    ['  Ana  ', 'A'],
    ['', '?'],
  ])('%s → %s', (name, expected) => {
    expect(initials(name)).toBe(expected);
  });
});

describe('Avatar', () => {
  it('sin foto muestra iniciales sobre el degradado, con nombre accesible', () => {
    render(<Avatar name="Yrvin Huamán" />);
    const avatar = screen.getByRole('img', { name: 'Yrvin Huamán' });
    expect(avatar).toHaveTextContent('YH');
    expect(avatar).toHaveClass('bg-avatar', 'text-on-ink');
    expect(avatar).toHaveStyle({ width: '36px', height: '36px' });
  });

  it('con foto usa la imagen y el nombre como alt', () => {
    render(<Avatar name="Yrvin Huamán" src="https://lh3.googleusercontent.com/a/foto" size={64} />);
    const img = screen.getByRole('img', { name: 'Yrvin Huamán' });
    expect(img.tagName).toBe('IMG');
    expect(img).toHaveAttribute('width', '64');
  });
});
