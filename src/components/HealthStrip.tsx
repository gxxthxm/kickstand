import type { ItemView } from '@/lib/garage';
import type { ItemStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

const FILL: Record<ItemStatus, string> = {
  Overdue: 'bg-overdue',
  DueSoon: 'bg-soon',
  // OK stays quiet so the items that need you stand out.
  OK: 'bg-[color-mix(in_oklab,var(--ok)_40%,var(--line))]',
};

/**
 * Bike health as one segment per tracked item, coloured by its status, most urgent first.
 * Reads at a glance like a warning-light row; the label carries the same facts in words.
 */
export function HealthStrip({ items, className }: { items: ItemView[]; className?: string }) {
  const enabled = items.filter((v) => v.item.enabled);
  const count = (s: ItemStatus) => enabled.filter((v) => v.info.status === s).length;
  const ok = count('OK');
  const parts = [
    `${ok} of ${enabled.length} items OK`,
    count('Overdue') && `${count('Overdue')} overdue`,
    count('DueSoon') && `${count('DueSoon')} due soon`,
  ].filter(Boolean);

  if (enabled.length === 0) return null;
  return (
    <div
      role="img"
      aria-label={`Health: ${parts.join(', ')}`}
      className={cn('flex h-1.5 gap-1', className)}
    >
      {enabled.map((v) => (
        <span
          key={v.item.id}
          aria-hidden
          className={cn('flex-1 rounded-full', FILL[v.info.status])}
        />
      ))}
    </div>
  );
}
