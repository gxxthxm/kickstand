import { Check, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate, formatKm } from '@/lib/format';
import type { ItemView } from '@/lib/garage';
import { describeInterval } from '@/lib/templates';
import { cn } from '@/lib/utils';
import { useGarage } from '@/store/garage';
import { usePulse, useUI } from '@/store/ui';
import { LifeGauge } from './LifeGauge';
import { StatusBadge, statusText, statusVar } from './StatusBadge';

/** One schedule item: status, microcopy, fuel-gauge progress, Mark done now, edit. */
export function ItemRow({ view, compact }: { view: ItemView; compact?: boolean }) {
  const { item, info, message } = view;
  const pulsing = usePulse(item.id);
  const markDone = useGarage((s) => s.markDone);
  const remove = useGarage((s) => s.remove);
  const openEditor = useUI((s) => s.openEditor);

  const done = () => {
    const svc = markDone(item.id);
    if (svc) {
      toast.success(`${item.name} marked done`, {
        description: `Reset at ${formatKm(svc.odometer)} today`,
        action: { label: 'Undo', onClick: () => remove('service', svc.id) },
      });
    }
  };

  return (
    <li
      className={cn(
        'flex flex-col gap-2.5 px-4 py-3.5',
        !item.enabled && 'opacity-60',
        pulsing && 'animate-pulse-once',
      )}
      style={{ ['--pulse-colour' as string]: statusVar[info.status] }}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="font-semibold">{item.name}</h3>
            {item.enabled ? (
              <StatusBadge status={info.status} />
            ) : (
              <span className="rounded-full bg-well px-2 py-0.5 text-xs font-semibold text-faint">
                Not tracked
              </span>
            )}
          </div>
          <p
            className={cn(
              'mt-0.5 text-sm',
              item.enabled && info.status !== 'OK'
                ? cn('font-medium', statusText[info.status])
                : 'text-muted',
            )}
          >
            {message}
          </p>
        </div>
        <div className="flex shrink-0 items-center">
          {item.enabled && !compact && (
            <button
              type="button"
              onClick={done}
              className="flex h-11 cursor-pointer items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-muted hover:bg-well hover:text-fg"
            >
              <Check aria-hidden className="size-4 text-ok" />
              <span className="hidden sm:inline">Mark done now</span>
              <span className="sm:hidden" aria-hidden>
                Done
              </span>
              <span className="sr-only sm:hidden">Mark {item.name} done now</span>
            </button>
          )}
          {!compact && (
            <button
              type="button"
              onClick={() => openEditor({ kind: 'item', id: item.id, bikeId: item.bikeId })}
              className="grid grid-cols-1 size-11 cursor-pointer place-items-center rounded-full text-muted hover:bg-well hover:text-fg"
            >
              <Pencil className="size-4" />
              <span className="sr-only">Edit {item.name}</span>
            </button>
          )}
        </div>
      </div>
      <LifeGauge
        progress={info.progress}
        status={info.status}
        label={`${item.name} interval`}
        disabled={!item.enabled}
      />
      <p className="num flex flex-wrap justify-between gap-x-3 text-xs text-faint">
        <span>Every {describeInterval(item)}</span>
        <span>
          Last {formatKm(item.lastDoneKm)} · {formatDate(item.lastDoneDate)}
        </span>
      </p>
    </li>
  );
}
