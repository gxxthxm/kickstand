import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface OdometerProps {
  value: number;
  /** Minimum number of drums; leading zeros are dimmed like a real cluster. */
  digits?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  unit?: string;
}

const SIZES = {
  sm: 'text-xl',
  md: 'text-3xl',
  lg: 'text-5xl',
};

/** Mechanical odometer: each digit is a drum that rolls to its new value. */
export function Odometer({
  value,
  digits = 6,
  size = 'md',
  className,
  unit = 'km',
}: OdometerProps) {
  const str = Math.max(0, Math.round(value)).toString().padStart(digits, '0');
  const firstSignificant = str.search(/[1-9]/);
  return (
    <span
      role="img"
      aria-label={`${Math.round(value).toLocaleString('en-IN')} ${unit}`}
      className={cn(
        'inline-flex items-baseline gap-1.5 font-mono leading-none font-medium tracking-tight',
        SIZES[size],
        className,
      )}
    >
      <span
        aria-hidden
        className="inline-flex overflow-hidden rounded-lg border border-line bg-well px-1"
      >
        {str.split('').map((ch, i) => (
          <Drum
            key={str.length - i}
            digit={Number(ch)}
            dim={firstSignificant === -1 ? i < str.length - 1 : i < firstSignificant}
            last={i === str.length - 1}
          />
        ))}
      </span>
      <span aria-hidden className="font-sans text-[0.5em] font-medium text-faint">
        {unit}
      </span>
    </span>
  );
}

function Drum({ digit, dim, last }: { digit: number; dim: boolean; last: boolean }) {
  return (
    <span
      className={cn(
        'relative inline-block h-[1.15em] w-[0.62em] overflow-hidden text-center',
        !last && 'border-r border-line/40',
        dim ? 'text-faint/50' : 'text-fg',
      )}
    >
      <motion.span
        className="absolute inset-x-0 top-0 flex flex-col"
        initial={false}
        animate={{ y: `${-digit * 10}%` }}
        transition={{ type: 'spring', stiffness: 140, damping: 20, mass: 0.9 }}
      >
        {Array.from({ length: 10 }, (_, n) => (
          <span key={n} className="flex h-[1.15em] items-center justify-center">
            {n}
          </span>
        ))}
      </motion.span>
    </span>
  );
}
