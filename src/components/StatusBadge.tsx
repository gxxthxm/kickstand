import { CircleCheck, Clock, OctagonAlert } from 'lucide-react';
import type { ItemStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

const STYLE: Record<ItemStatus, { cls: string; Icon: typeof Clock; label: string }> = {
  Overdue: {
    cls: 'text-overdue bg-[color-mix(in_oklab,var(--overdue)_14%,transparent)]',
    Icon: OctagonAlert,
    label: 'Overdue',
  },
  DueSoon: {
    cls: 'text-soon bg-[color-mix(in_oklab,var(--soon)_14%,transparent)]',
    Icon: Clock,
    label: 'Due soon',
  },
  OK: {
    cls: 'text-ok bg-[color-mix(in_oklab,var(--ok)_12%,transparent)]',
    Icon: CircleCheck,
    label: 'OK',
  },
};

export const statusText: Record<ItemStatus, string> = {
  Overdue: 'text-overdue',
  DueSoon: 'text-soon',
  OK: 'text-ok',
};

export const statusVar: Record<ItemStatus, string> = {
  Overdue: 'var(--overdue)',
  DueSoon: 'var(--soon)',
  OK: 'var(--ok)',
};

export function StatusIcon({ status, className }: { status: ItemStatus; className?: string }) {
  const { Icon } = STYLE[status];
  return <Icon aria-hidden className={cn('size-4 shrink-0', statusText[status], className)} />;
}

/** Status chip: always an icon and a word, never colour alone. */
export function StatusBadge({
  status,
  label,
  className,
}: {
  status: ItemStatus;
  label?: string;
  className?: string;
}) {
  const { cls, Icon, label: fallback } = STYLE[status];
  return (
    <span
      className={cn(
        'inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2 text-xs font-semibold whitespace-nowrap',
        cls,
        className,
      )}
    >
      <Icon aria-hidden className="size-3.5" />
      {label ?? fallback}
    </span>
  );
}
