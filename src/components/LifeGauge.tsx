import type { ItemStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

interface LifeGaugeProps {
  /** Share of the interval used, 0–1. */
  progress: number;
  status: ItemStatus;
  label: string;
  segments?: number;
  className?: string;
  disabled?: boolean;
}

const FILL: Record<ItemStatus, string> = {
  OK: 'bg-ok',
  DueSoon: 'bg-soon',
  Overdue: 'bg-overdue',
};

/**
 * Schedule progress drawn like a fuel gauge: full (F) right after a service, draining towards
 * empty (E) as the interval is used up.
 */
export function LifeGauge({
  progress,
  status,
  label,
  segments = 12,
  className,
  disabled,
}: LifeGaugeProps) {
  const left = status === 'Overdue' ? 0 : Math.max(0, 1 - progress);
  const lit = status === 'Overdue' ? 0 : Math.max(1, Math.ceil(left * segments - 0.001));
  const usedPct = Math.round(progress * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={usedPct}
      aria-valuetext={status === 'Overdue' ? 'Past due' : `${100 - usedPct}% of interval left`}
      className={cn('flex items-center gap-2', className)}
    >
      <span
        aria-hidden
        className={cn(
          'font-display text-xs font-bold',
          status === 'Overdue' ? 'text-overdue' : 'text-faint',
        )}
      >
        E
      </span>
      <div aria-hidden className="flex h-2.5 flex-1 gap-[3px]">
        {Array.from({ length: segments }, (_, i) => (
          <span
            key={i}
            className={cn(
              'flex-1 rounded-[2px] transition-colors duration-500',
              i < lit ? (disabled ? 'bg-line-strong' : FILL[status]) : 'bg-line',
              status === 'Overdue' && i === 0 && !disabled && 'bg-overdue/40',
            )}
          />
        ))}
      </div>
      <span aria-hidden className="font-display text-xs font-bold text-faint">
        F
      </span>
    </div>
  );
}
