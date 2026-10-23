import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { BookOpen, Plus } from 'lucide-react';
import { formatMoney } from '@/lib/format';
import { activity, groupByMonth, type ActivityKind } from '@/lib/garage';
import { useData, useEconomyReadings, useToday } from '@/store/hooks';
import { useOpenLog } from '@/store/useOpenLog';
import { ActivityRow } from '@/components/ActivityRow';
import { BikeSwatch } from '@/components/BikeSwatch';
import { EmptyState, Page, PageHeader } from '@/components/PageHeader';
import { StatTile } from '@/components/StatTile';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/segmented';

const KINDS: { value: ActivityKind; label: string }[] = [
  { value: 'fuel', label: 'Fuel' },
  { value: 'ride', label: 'Rides' },
  { value: 'service', label: 'Service' },
  { value: 'reading', label: 'Odometer' },
];

const PAGE = 40;

/** `/logbook` — every fill-up, ride, service and reading across the garage. */
export default function Logbook() {
  const data = useData();
  const today = useToday();
  const openLog = useOpenLog();
  const readings = useEconomyReadings(data.fuel);
  const [kind, setKind] = useState<ActivityKind | null>(null);
  const [bikeId, setBikeId] = useState<string | null>(null);
  const [limit, setLimit] = useState(PAGE);

  const items = useMemo(
    () => activity(data, { bikeId: bikeId ?? undefined, kinds: kind ? [kind] : undefined }),
    [data, bikeId, kind],
  );
  const months = useMemo(() => groupByMonth(items.slice(0, limit)), [items, limit]);

  // This month across the garage, independent of filters.
  const thisMonth = today.slice(0, 7);
  const monthStats = useMemo(() => {
    const logs = activity(data).filter((a) => a.date.startsWith(thisMonth));
    const km = data.rides
      .filter((r) => r.date.startsWith(thisMonth))
      .reduce((s, r) => s + r.endKm - r.startKm, 0);
    return { logs: logs.length, spend: logs.reduce((s, a) => s + a.cost, 0), km };
  }, [data, thisMonth]);

  if (data.bikes.length === 0) {
    return (
      <Page>
        <PageHeader title="Logbook" />
        <EmptyState icon={<BookOpen />} title="Nothing logged yet">
          Add a bike, then every fill-up, ride and service you log lands here.
        </EmptyState>
      </Page>
    );
  }

  return (
    <Page className="max-w-4xl">
      <PageHeader
        eyebrow="All bikes"
        title="Logbook"
        actions={
          <Button size="sm" onClick={() => openLog()}>
            <Plus /> Log
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-3">
        <StatTile
          size="sm"
          label="This month"
          value={formatMoney(monthStats.spend)}
          sub="fuel + service"
        />
        <StatTile
          size="sm"
          label="Rides"
          value={monthStats.km.toLocaleString('en-IN')}
          unit="km"
          sub="this month"
        />
        <StatTile size="sm" label="Logs" value={monthStats.logs} sub="this month" />
      </div>

      <div className="mt-6 flex flex-col gap-2">
        <div
          role="group"
          aria-label="Filter by type"
          className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0"
        >
          <Chip pressed={kind === null} onPressedChange={() => setKind(null)} className="shrink-0">
            All
          </Chip>
          {KINDS.map((k) => (
            <Chip
              key={k.value}
              pressed={kind === k.value}
              onPressedChange={(p) => setKind(p ? k.value : null)}
              className="shrink-0"
            >
              {k.label}
            </Chip>
          ))}
        </div>
        {data.bikes.length > 1 && (
          <div
            role="group"
            aria-label="Filter by bike"
            className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0"
          >
            <Chip
              pressed={bikeId === null}
              onPressedChange={() => setBikeId(null)}
              className="shrink-0"
            >
              All bikes
            </Chip>
            {data.bikes.map((b) => (
              <Chip
                key={b.id}
                pressed={bikeId === b.id}
                onPressedChange={(p) => setBikeId(p ? b.id : null)}
                className="shrink-0"
              >
                <BikeSwatch colour={b.colour} className="size-2.5" />
                {b.nickname}
              </Chip>
            ))}
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <p className="mt-8 text-center text-sm text-muted">No logs match these filters.</p>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          {months.map((m) => (
            <section key={m.month} aria-labelledby={`m-${m.month}`}>
              <div className="mb-2 flex items-baseline justify-between px-1">
                <h2 id={`m-${m.month}`} className="font-display text-lg font-semibold">
                  {format(parseISO(`${m.month}-01`), 'MMMM yyyy')}
                </h2>
                <p className="num text-sm text-muted">
                  {m.items.length} log{m.items.length === 1 ? '' : 's'}
                  {m.cost > 0 && ` · ${formatMoney(m.cost)}`}
                </p>
              </div>
              <Card>
                <ul className="divide-y divide-line">
                  {m.items.map((a) => (
                    <ActivityRow
                      key={`${a.kind}-${a.id}`}
                      a={a}
                      data={data}
                      readings={readings}
                      showBike={!bikeId && data.bikes.length > 1}
                    />
                  ))}
                </ul>
              </Card>
            </section>
          ))}
          {items.length > limit && (
            <Button
              variant="secondary"
              className="self-center"
              onClick={() => setLimit((l) => l + PAGE * 2)}
            >
              Show older ({items.length - limit} more)
            </Button>
          )}
        </div>
      )}
    </Page>
  );
}
