import { parseTheme, THEME_COOKIE, themeCookie } from '@/lib/theme';

describe('parseTheme', () => {
  it.each([
    ['dark', 'dark'],
    ['light', 'light'],
    [undefined, 'light'],
    [null, 'light'],
    ['', 'light'],
    ['DARK', 'light'],
    ['<script>', 'light'],
  ] as const)('%s → %s', (value, expected) => {
    expect(parseTheme(value)).toBe(expected);
  });
});

describe('themeCookie', () => {
  it('dura un año, aplica a todo el sitio y es SameSite=Lax', () => {
    expect(themeCookie('dark')).toBe(
      `${THEME_COOKIE}=dark; Path=/; Max-Age=31536000; SameSite=Lax`,
    );
  });
});
