import { Motorbike, Scooter } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Pick black or white for legible marks on the bike's colour. */
function inkFor(hex: string): string {
  const n = parseInt(hex.replace('#', '').padEnd(6, '0').slice(0, 6), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.3 ? '#0a0a0a' : '#ffffff';
}

/** The bike's identity: a solid tile in its colour with a motorcycle or scooter mark. */
export function BikeAvatar({
  colour,
  scooter,
  size = 'md',
  className,
}: {
  colour: string;
  scooter?: boolean;
  size?: 'md' | 'lg';
  className?: string;
}) {
  const Icon = scooter ? Scooter : Motorbike;
  return (
    <span
      aria-hidden
      className={cn(
        'grid shrink-0 place-items-center',
        size === 'lg' ? 'size-14 rounded-2xl' : 'size-11 rounded-[0.875rem]',
        className,
      )}
      style={{ background: colour, color: inkFor(colour) }}
    >
      <Icon className={size === 'lg' ? 'size-7' : 'size-[1.375rem]'} strokeWidth={1.75} />
    </span>
  );
}
