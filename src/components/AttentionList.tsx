import { Check, FileText, RefreshCw } from 'lucide-react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import type { AttentionRow } from '@/lib/garage';
import { cn } from '@/lib/utils';
import { useGarage } from '@/store/garage';
import { usePulse, useUI } from '@/store/ui';
import { BikeSwatch } from './BikeSwatch';
import { StatusBadge, statusVar } from './StatusBadge';

/** Combined "Needs attention" list: overdue → due soon, items and papers across all bikes. */
export function AttentionList({
  rows,
  showBike = true,
}: {
  rows: AttentionRow[];
  showBike?: boolean;
}) {
  return (
    <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-card shadow-card">
      {rows.map((row) => (
        <AttentionItem key={row.key} row={row} showBike={showBike} />
      ))}
    </ul>
  );
}

function AttentionItem({ row, showBike }: { row: AttentionRow; showBike: boolean }) {
  const pulsing = usePulse(row.id);
  const markDone = useGarage((s) => s.markDone);
  const remove = useGarage((s) => s.remove);
  const openEditor = useUI((s) => s.openEditor);

  return (
    <li
      className={cn('flex items-center gap-3 py-2.5 pr-2 pl-4', pulsing && 'animate-pulse-once')}
      style={{ ['--pulse-colour' as string]: statusVar[row.status] }}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <StatusBadge status={row.status} label={row.statusLabel} />
          {showBike && (
            <Link
              to={`/bikes/${row.bike.id}/${row.kind === 'doc' ? 'docs' : 'service'}`}
              className="inline-flex min-w-0 items-center gap-1.5 text-xs font-medium text-muted hover:text-fg"
            >
              <BikeSwatch colour={row.bike.colour} className="size-2.5" />
              <span className="truncate">{row.bike.nickname}</span>
            </Link>
          )}
        </div>
        <p className="mt-1 text-[0.9375rem] leading-snug font-medium">
          {row.kind === 'doc' && (
            <FileText aria-hidden className="mr-1 inline size-4 -translate-y-px text-faint" />
          )}
          {row.message}
        </p>
      </div>
      {row.kind === 'item' ? (
        <button
          type="button"
          onClick={() => {
            const svc = markDone(row.id);
            if (svc) {
              toast.success('Marked done', {
                description: `Reset at ${svc.odometer.toLocaleString('en-IN')} km today`,
                action: { label: 'Undo', onClick: () => remove('service', svc.id) },
              });
            }
          }}
          className="flex h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-line px-3.5 text-sm font-semibold hover:border-line-strong hover:bg-well"
        >
          <Check aria-hidden className="size-4 text-ok" />
          Done
          <span className="sr-only">: mark {row.message} as done now</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => openEditor({ kind: 'doc', id: row.id, bikeId: row.bike.id })}
          className="flex h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-line px-3.5 text-sm font-semibold hover:border-line-strong hover:bg-well"
        >
          <RefreshCw aria-hidden className="size-4 text-info" />
          Renew
          <span className="sr-only">: update {row.message}</span>
        </button>
      )}
    </li>
  );
}
