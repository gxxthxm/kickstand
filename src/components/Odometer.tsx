import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface OdometerProps {
  value: number;
  className?: string;
  unit?: string;
}

/**
 * The odometer as a plain figure ("21,700 km") whose digits roll to a new value when it
 * changes. Size it with text classes on className.
 */
export function Odometer({ value, className, unit = 'km' }: OdometerProps) {
  const str = Math.max(0, Math.round(value)).toLocaleString('en-IN');
  const chars = str.split('');
  return (
    <span
      role="img"
      aria-label={`${str} ${unit}`}
      className={cn(
        'inline-flex items-baseline font-semibold tracking-tight tabular-nums',
        className,
      )}
    >
      <span aria-hidden className="inline-flex">
        {chars.map((ch, i) =>
          /\d/.test(ch) ? (
            // Key from the right so existing drums keep their place as the number grows.
            <Drum key={chars.length - i} digit={Number(ch)} />
          ) : (
            <span key={chars.length - i}>{ch}</span>
          ),
        )}
      </span>
      <span aria-hidden className="ml-1 text-[0.5em] font-medium tracking-normal text-faint">
        {unit}
      </span>
    </span>
  );
}

function Drum({ digit }: { digit: number }) {
  return (
    <span className="relative inline-block h-[1.2em] w-[1ch] overflow-hidden text-center">
      {/* Invisible copy keeps the baseline aligned with surrounding text. */}
      <span className="invisible">{digit}</span>
      <motion.span
        className="absolute inset-x-0 top-0 flex flex-col"
        initial={false}
        animate={{ y: `${-digit * 10}%` }}
        transition={{ type: 'spring', stiffness: 140, damping: 20, mass: 0.9 }}
      >
        {Array.from({ length: 10 }, (_, n) => (
          <span key={n} className="flex h-[1.2em] items-center justify-center">
            {n}
          </span>
        ))}
      </motion.span>
    </span>
  );
}
