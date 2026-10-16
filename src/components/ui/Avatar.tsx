import Image from 'next/image';
import { cx } from '@/lib/cx';

export type AvatarSize = 36 | 40 | 64;
export type AvatarProps = { name: string; src?: string; size?: AvatarSize; className?: string };

// Tamaños del export: header (36), lista de cuentas (40) y perfil (64).
const TEXT: Record<AvatarSize, string> = {
  36: 'text-md',
  40: 'text-base',
  64: 'text-[22px]',
};

/** Iniciales de las dos primeras palabras: "Yrvin Huamán" → "YH". */
export function initials(name: string): string {
  const letters = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('');
  return letters.toUpperCase() || '?';
}

export function Avatar({ name, src, size = 36, className }: AvatarProps) {
  const box = cx('flex-none overflow-hidden rounded-full', className);
  const dimensions = { width: size, height: size };

  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        {...dimensions}
        className={cx(box, 'object-cover')}
        style={dimensions}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label={name}
      className={cx(
        box,
        'grid place-items-center bg-avatar font-ui font-extrabold text-on-ink',
        TEXT[size],
      )}
      style={dimensions}
    >
      <span aria-hidden="true">{initials(name)}</span>
    </span>
  );
}
