import { useMemo, useState } from 'react';
import { Plus, Wrench } from 'lucide-react';
import { formatDate, formatKm, formatMoney } from '@/lib/format';
import { bikeItems } from '@/lib/garage';
import type { Bike } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useData, useToday } from '@/store/hooks';
import { useUI } from '@/store/ui';
import { useOpenLog } from '@/store/useOpenLog';
import { ItemRow } from '@/components/ItemRow';
import { EmptyState } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, SectionTitle } from '@/components/ui/card';
import { Chip } from '@/components/ui/segmented';

export function ServiceTab({ bike }: { bike: Bike }) {
  const data = useData();
  const today = useToday();
  const openEditor = useUI((s) => s.openEditor);
  const openLog = useOpenLog();
  const [filter, setFilter] = useState<string | null>(null);

  const views = useMemo(() => bikeItems(data, bike, today), [data, bike, today]);
  const active = views.filter((v) => v.item.enabled);
  const disabled = views.filter((v) => !v.item.enabled);
  const history = useMemo(
    () =>
      data.services
        .filter((s) => s.bikeId === bike.id)
        .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.odometer - a.odometer)),
    [data.services, bike.id],
  );
  const usedItems = useMemo(() => {
    const ids = new Set(history.flatMap((s) => s.itemIds));
    return data.schedule.filter((i) => ids.has(i.id));
  }, [history, data.schedule]);
  const shown = filter ? history.filter((s) => s.itemIds.includes(filter)) : history;
  const itemName = (id: string) => data.schedule.find((i) => i.id === id)?.name;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
      <section aria-labelledby="schedule-title">
        <div className="mb-3 flex items-center justify-between gap-2">
          <SectionTitle id="schedule-title">Schedule</SectionTitle>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => openEditor({ kind: 'item', bikeId: bike.id })}
          >
            <Plus /> Add item
          </Button>
        </div>
        {active.length === 0 && disabled.length === 0 ? (
          <EmptyState icon={<Wrench />} title="No schedule yet">
            Add items like engine oil or chain lube with a km and/or month interval.
          </EmptyState>
        ) : (
          <>
            <Card>
              <ul className="divide-y divide-line">
                {active.map((v) => (
                  <ItemRow key={v.item.id} view={v} />
                ))}
              </ul>
            </Card>
            {disabled.length > 0 && (
              <>
                <h3 className="label-caps mt-5 mb-2">Not tracked · {disabled.length}</h3>
                <Card>
                  <ul className="divide-y divide-line">
                    {disabled.map((v) => (
                      <ItemRow key={v.item.id} view={v} />
                    ))}
                  </ul>
                </Card>
              </>
            )}
          </>
        )}
      </section>

      <section aria-labelledby="history-title">
        <div className="mb-3 flex items-center justify-between gap-2">
          <SectionTitle id="history-title">History</SectionTitle>
          <Button size="sm" onClick={() => openLog('service', bike.id)}>
            <Plus /> Log service
          </Button>
        </div>
        {history.length === 0 ? (
          <EmptyState icon={<Wrench />} title="No services logged">
            Log a service and pick what was done — those items reset to the service odometer.
          </EmptyState>
        ) : (
          <>
            <div
              role="group"
              aria-label="Filter by item"
              className="scrollbar-none -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0"
            >
              <Chip
                pressed={filter === null}
                onPressedChange={() => setFilter(null)}
                className="shrink-0"
              >
                All
              </Chip>
              {usedItems.map((i) => (
                <Chip
                  key={i.id}
                  pressed={filter === i.id}
                  onPressedChange={(p) => setFilter(p ? i.id : null)}
                  className="shrink-0"
                >
                  {i.name}
                </Chip>
              ))}
            </div>
            <ol className="relative ml-2 border-l-2 border-line pl-5">
              {shown.map((s) => (
                <li key={s.id} className="relative pb-4 last:pb-0">
                  <span
                    aria-hidden
                    className={cn(
                      'absolute top-4 -left-[1.6875rem] size-3 rounded-full ring-4 ring-bg',
                      s.where === 'DIY' ? 'bg-info' : 'bg-accent',
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => openEditor({ kind: 'service', id: s.id })}
                    className="w-full cursor-pointer rounded-2xl border border-line bg-card p-3.5 text-left transition-colors hover:border-line-strong"
                  >
                    <span className="num flex items-baseline justify-between gap-2 text-xs text-faint">
                      <span>{formatDate(s.date)}</span>
                      <span>{formatKm(s.odometer)}</span>
                    </span>
                    <span className="mt-1 flex items-center gap-2">
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-semibold',
                          s.where === 'DIY'
                            ? 'bg-[color-mix(in_oklab,var(--info)_15%,transparent)] text-info'
                            : 'bg-well text-muted',
                        )}
                      >
                        {s.where === 'DIY' ? 'DIY' : 'Workshop'}
                      </span>
                      {s.where !== 'DIY' && (
                        <span className="min-w-0 truncate text-sm font-semibold">{s.where}</span>
                      )}
                      <span className="num ml-auto shrink-0 font-display text-lg font-semibold">
                        {s.partsCost + s.labourCost > 0
                          ? formatMoney(s.partsCost + s.labourCost)
                          : '—'}
                      </span>
                    </span>
                    {s.itemIds.length > 0 && (
                      <span className="mt-2 flex flex-wrap gap-1.5">
                        {s.itemIds.map((id) => (
                          <span
                            key={id}
                            className="rounded-md bg-well px-2 py-0.5 text-xs text-muted"
                          >
                            {itemName(id) ?? 'Removed item'}
                          </span>
                        ))}
                      </span>
                    )}
                    {s.notes && <span className="mt-2 block text-sm text-muted">{s.notes}</span>}
                  </button>
                </li>
              ))}
            </ol>
          </>
        )}
      </section>
    </div>
  );
}
