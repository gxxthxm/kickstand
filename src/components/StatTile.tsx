import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function StatTile({
  label,
  value,
  unit,
  sub,
  className,
  tone,
  size = 'md',
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  sub?: ReactNode;
  className?: string;
  tone?: 'overdue' | 'ok';
  /** 'sm' for three-across rows on phones. */
  size?: 'sm' | 'md';
}) {
  return (
    <div
      className={cn(
        'min-w-0 rounded-2xl border border-line bg-card',
        size === 'sm' ? 'p-3' : 'p-3.5',
        className,
      )}
    >
      <p className="label-caps truncate">{label}</p>
      <p
        className={cn(
          'mt-1.5 truncate font-display leading-none font-semibold',
          size === 'sm' ? 'text-xl sm:text-3xl' : 'text-[1.75rem] sm:text-3xl',
          tone === 'overdue' && 'text-overdue',
          tone === 'ok' && 'text-ok',
        )}
      >
        {value}
        {unit && (
          <span className="ml-1 text-sm font-medium tracking-normal text-muted">{unit}</span>
        )}
      </p>
      {sub && <p className="num mt-1 truncate text-xs text-faint">{sub}</p>}
    </div>
  );
}
