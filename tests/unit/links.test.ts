import { externalHref, mailtoHref, whatsappHref } from '@/lib/links';

describe('externalHref', () => {
  it.each([
    ['polerastudio.pe', 'https://polerastudio.pe'],
    ['landing-colegio-agb.vercel.app/sanity', 'https://landing-colegio-agb.vercel.app/sanity'],
    ['https://github.com/x', 'https://github.com/x'],
    ['HTTP://viejo.pe', 'HTTP://viejo.pe'],
    ['  figma.com/design/x  ', 'https://figma.com/design/x'],
  ])('%s → %s', (value, expected) => {
    expect(externalHref(value)).toBe(expected);
  });

  it('rechaza esquemas peligrosos y vacíos', () => {
    expect(externalHref('javascript:alert(1)')).toBeNull();
    expect(externalHref('data:text/html,hola')).toBeNull();
    expect(externalHref('')).toBeNull();
    expect(externalHref(null)).toBeNull();
  });
});

describe('mailto y WhatsApp', () => {
  it('arma los enlaces o devuelve null', () => {
    expect(mailtoHref('admin@sonrident.pe')).toBe('mailto:admin@sonrident.pe');
    expect(mailtoHref(null)).toBeNull();
    expect(whatsappHref('+51 954 228 017')).toBe('https://wa.me/51954228017');
    expect(whatsappHref('')).toBeNull();
  });
});
