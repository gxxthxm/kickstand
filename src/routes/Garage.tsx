import { useMemo } from 'react';
import { format } from 'date-fns';
import { CircleCheck, Plus, Sparkles, Warehouse, X } from 'lucide-react';
import { Link } from 'react-router';
import { attentionList, bikeItems, healthOf } from '@/lib/garage';
import { useGarage } from '@/store/garage';
import { useData, useToday } from '@/store/hooks';
import { AttentionList } from '@/components/AttentionList';
import { BikeCard } from '@/components/BikeCard';
import { BikeSwatch } from '@/components/BikeSwatch';
import { EmptyState, Page, PageHeader } from '@/components/PageHeader';
import { StatusIcon } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';

export default function Garage() {
  const data = useData();
  const today = useToday();
  const bannerDismissed = useGarage((s) => s.settings.bannerDismissed);
  const setSettings = useGarage((s) => s.setSettings);
  const resetDemo = useGarage((s) => s.resetDemo);

  const rows = useMemo(() => attentionList(data, today), [data, today]);
  const cards = useMemo(
    () =>
      data.bikes.map((bike) => {
        const items = bikeItems(data, bike, today).filter((i) => i.item.enabled);
        return { bike, health: healthOf(data, bike, today), top: items[0] };
      }),
    [data, today],
  );
  const nextUp = useMemo(
    () =>
      cards
        .filter((c) => c.top)
        .sort((a, b) => (a.top?.info.remaining ?? 1) - (b.top?.info.remaining ?? 1))[0],
    [cards],
  );

  const overdue = rows.filter((r) => r.status === 'Overdue').length;
  const soon = rows.filter((r) => r.status === 'DueSoon').length;
  const isDemo = data.bikes.some((b) => b.id.startsWith('seed-'));

  return (
    <Page>
      <PageHeader
        eyebrow={format(new Date(), 'EEEE, d MMMM')}
        title="Garage"
        actions={
          data.bikes.length > 0 && (
            <Button asChild variant="secondary" size="sm">
              <Link to="/bikes/new">
                <Plus /> <span className="hidden sm:inline">Add bike</span>
                <span className="sr-only sm:hidden">Add bike</span>
              </Link>
            </Button>
          )
        }
      />

      {isDemo && !bannerDismissed && (
        <div
          role="note"
          className="mb-5 flex items-start gap-3 rounded-2xl border border-[color-mix(in_oklab,var(--accent)_40%,transparent)] bg-[color-mix(in_oklab,var(--accent)_10%,var(--card))] p-3 pl-4"
        >
          <Sparkles aria-hidden className="mt-0.5 size-5 shrink-0 text-accent-ink" />
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-medium">
              Sample garage loaded with {data.bikes.length} bikes. Add your own or reset anytime.
            </p>
            <div className="-mb-2 flex gap-x-5">
              <Link
                to="/bikes/new"
                className="inline-flex min-h-11 items-center font-semibold text-accent-ink underline-offset-4 hover:underline"
              >
                Add your bike
              </Link>
              <Link
                to="/settings"
                className="inline-flex min-h-11 items-center font-semibold text-muted underline-offset-4 hover:underline"
              >
                Reset
              </Link>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSettings({ bannerDismissed: true })}
            className="-mt-1 -mr-1 grid grid-cols-1 size-11 shrink-0 cursor-pointer place-items-center rounded-full text-muted hover:bg-well hover:text-fg"
          >
            <X className="size-5" />
            <span className="sr-only">Dismiss</span>
          </button>
        </div>
      )}

      {data.bikes.length === 0 ? (
        <EmptyState
          icon={<Warehouse />}
          title="Your garage is empty"
          actions={
            <>
              <Button asChild>
                <Link to="/bikes/new">
                  <Plus /> Add your first bike
                </Link>
              </Button>
              <Button variant="secondary" onClick={resetDemo}>
                Load sample garage
              </Button>
            </>
          }
        >
          Add a bike and pick a service template. Every fill-up and ride you log keeps the odometer
          — and what's due — current.
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,25rem)] lg:items-start">
          <section aria-labelledby="attention-title" className="lg:sticky lg:top-6 lg:order-2">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 id="attention-title" className="font-display text-xl font-semibold">
                Needs attention
              </h2>
              {rows.length > 0 && (
                <p className="num flex items-center gap-3 text-sm font-semibold">
                  {overdue > 0 && (
                    <span className="inline-flex items-center gap-1 text-overdue">
                      <StatusIcon status="Overdue" /> {overdue} overdue
                    </span>
                  )}
                  {soon > 0 && (
                    <span className="inline-flex items-center gap-1 text-soon">
                      <StatusIcon status="DueSoon" /> {soon} soon
                    </span>
                  )}
                </p>
              )}
            </div>
            {rows.length > 0 ? (
              <AttentionList rows={rows} showBike={data.bikes.length > 1} />
            ) : (
              <div className="flex items-start gap-3 rounded-[var(--radius-card)] border border-line bg-card p-4">
                <CircleCheck aria-hidden className="mt-0.5 size-6 shrink-0 text-ok" />
                <div>
                  <p className="font-display text-xl font-semibold">All clear</p>
                  <p className="text-sm text-muted">
                    Nothing's overdue or due in the next two weeks.
                  </p>
                  {nextUp?.top && (
                    <p className="mt-2 flex items-center gap-1.5 text-sm">
                      <BikeSwatch colour={nextUp.bike.colour} className="size-2.5" />
                      <span className="font-medium">{nextUp.bike.nickname}:</span>
                      <span className="text-muted">{nextUp.top.message}</span>
                    </p>
                  )}
                </div>
              </div>
            )}
          </section>

          <section aria-labelledby="bikes-title" className="lg:order-1">
            <h2 id="bikes-title" className="mb-3 font-display text-xl font-semibold">
              {data.bikes.length === 1 ? 'Your bike' : `Your bikes · ${data.bikes.length}`}
            </h2>
            <div className="grid grid-cols-1 gap-4 min-[1800px]:grid-cols-2">
              {cards.map((c) => (
                <BikeCard key={c.bike.id} {...c} />
              ))}
            </div>
          </section>
        </div>
      )}
    </Page>
  );
}
