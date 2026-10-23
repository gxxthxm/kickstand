import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function StatTile({
  label,
  value,
  unit,
  sub,
  className,
  tone,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  sub?: ReactNode;
  className?: string;
  tone?: 'overdue' | 'ok';
}) {
  return (
    <div className={cn('min-w-0 rounded-2xl border border-line bg-card p-3.5', className)}>
      <p className="label-caps truncate">{label}</p>
      <p
        className={cn(
          'mt-1 truncate font-display text-3xl leading-none font-semibold',
          tone === 'overdue' && 'text-overdue',
          tone === 'ok' && 'text-ok',
        )}
      >
        {value}
        {unit && <span className="ml-1 text-base font-medium text-muted">{unit}</span>}
      </p>
      {sub && <p className="num mt-1 truncate text-xs text-faint">{sub}</p>}
    </div>
  );
}
