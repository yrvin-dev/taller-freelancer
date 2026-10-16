import { iconClass } from '@/lib/icons';

describe('iconClass', () => {
  it('usa regular rounded por defecto', () => {
    expect(iconClass('home')).toBe('fi fi-rr-home');
  });

  it('usa solid rounded con solid', () => {
    expect(iconClass('brand', { solid: true })).toBe('fi fi-sr-fire-flame-curved');
  });

  it('los íconos de marca siempre salen del set brands', () => {
    expect(iconClass('google')).toBe('fi fi-brands-google');
    expect(iconClass('github', { solid: true })).toBe('fi fi-brands-github');
  });
});
