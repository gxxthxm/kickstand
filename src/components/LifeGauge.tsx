import type { ItemStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

interface LifeGaugeProps {
  /** Share of the interval used, 0–1. */
  progress: number;
  status: ItemStatus;
  label: string;
  className?: string;
  disabled?: boolean;
}

const FILL: Record<ItemStatus, string> = {
  OK: 'bg-ok',
  DueSoon: 'bg-soon',
  Overdue: 'bg-overdue',
};

/** How much of the service interval is left: full right after a service, empty when due. */
export function LifeGauge({ progress, status, label, className, disabled }: LifeGaugeProps) {
  const left = status === 'Overdue' ? 0 : Math.max(0, 1 - progress);
  const usedPct = Math.round(progress * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={usedPct}
      aria-valuetext={status === 'Overdue' ? 'Past due' : `${100 - usedPct}% of interval left`}
      className={cn(
        'h-1.5 overflow-hidden rounded-full',
        status === 'Overdue' && !disabled
          ? 'bg-[color-mix(in_oklab,var(--overdue)_30%,var(--line))]'
          : 'bg-line',
        className,
      )}
    >
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-500',
          disabled ? 'bg-line-strong' : FILL[status],
        )}
        style={{ width: `${Math.max(left * 100, status === 'Overdue' ? 0 : 3)}%` }}
      />
    </div>
  );
}
