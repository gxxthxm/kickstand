import { useMemo, useState } from 'react';
import { Fuel, Plus, TrendingDown } from 'lucide-react';
import {
  convertEconomy,
  economyUnitLabel,
  formatEconomy,
  fuelStats,
  pricePerLitre,
  sortFuel,
} from '@/lib/fuel';
import { formatDate, formatKm, formatMoney, formatMoneyPrecise } from '@/lib/format';
import type { Bike } from '@/lib/types';
import { useGarage } from '@/store/garage';
import { useEconomyUnit } from '@/store/hooks';
import { useUI } from '@/store/ui';
import { useOpenLog } from '@/store/useOpenLog';
import EconomyChart from '@/components/charts/EconomyChart';
import PriceChart from '@/components/charts/PriceChart';
import { EmptyState } from '@/components/PageHeader';
import { StatTile } from '@/components/StatTile';
import { Button } from '@/components/ui/button';
import { Card, SectionTitle } from '@/components/ui/card';

const PAGE = 12;

export default function FuelTab({ bike }: { bike: Bike }) {
  const allFuel = useGarage((s) => s.fuel);
  const unit = useEconomyUnit();
  const openEditor = useUI((s) => s.openEditor);
  const openLog = useOpenLog();
  const [limit, setLimit] = useState(PAGE);

  const entries = useMemo(() => allFuel.filter((f) => f.bikeId === bike.id), [allFuel, bike.id]);
  const stats = useMemo(() => fuelStats(entries), [entries]);
  const newest = useMemo(() => sortFuel(entries).reverse(), [entries]);
  const readingById = useMemo(
    () => new Map(stats.readings.map((r) => [r.entryId, r])),
    [stats.readings],
  );
  const prices = useMemo(
    () =>
      sortFuel(entries).map((e) => ({
        date: e.date,
        odometer: e.odometer,
        price: Number(pricePerLitre(e).toFixed(2)),
      })),
    [entries],
  );
  const label = economyUnitLabel(unit);
  const fmt = (kmpl: number) => convertEconomy(kmpl, unit).toFixed(1);

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={<Fuel />}
        title="No fill-ups yet"
        actions={
          <Button onClick={() => openLog('fuel', bike.id)}>
            <Plus /> Log a fill-up
          </Button>
        }
      >
        Log odometer, litres and amount at the pump. Two full tanks in a row give you real economy.
      </EmptyState>
    );
  }

  const prevPrice = prices.length > 1 ? prices[prices.length - 2].price : undefined;
  const lastPrice = prices[prices.length - 1]?.price;

  return (
    <div className="flex flex-col gap-5">
      {stats.alert && stats.latest && stats.average && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-[color-mix(in_oklab,var(--soon)_45%,transparent)] bg-[color-mix(in_oklab,var(--soon)_10%,var(--card))] p-4"
        >
          <TrendingDown aria-hidden className="mt-0.5 size-5 shrink-0 text-soon" />
          <div className="text-sm">
            <p className="font-semibold">Mileage dropped — check tyre pressure or chain</p>
            <p className="num text-muted">
              Latest tank {formatEconomy(stats.latest.kmpl, unit)} —{' '}
              {Math.round((stats.latestDrop ?? 0) * 100)}% worse than your{' '}
              {formatEconomy(stats.average, unit)} average.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile
          label="Average"
          value={stats.average ? fmt(stats.average) : '—'}
          unit={stats.average ? label : undefined}
          sub={stats.readings.length ? `${stats.readings.length} readings` : undefined}
        />
        <StatTile
          label="Best"
          value={stats.best ? fmt(stats.best.kmpl) : '—'}
          unit={stats.best ? label : undefined}
          sub={stats.best ? formatDate(stats.best.date) : undefined}
          tone={stats.best ? 'ok' : undefined}
        />
        <StatTile
          label="Latest"
          value={stats.latest ? fmt(stats.latest.kmpl) : '—'}
          unit={stats.latest ? label : undefined}
          sub={stats.latest ? formatDate(stats.latest.date) : undefined}
          tone={stats.alert ? 'overdue' : undefined}
        />
        <StatTile
          label="Price / litre"
          value={lastPrice ? formatMoneyPrecise(lastPrice) : '—'}
          sub={
            stats.avgPricePerLitre ? `avg ${formatMoneyPrecise(stats.avgPricePerLitre)}` : undefined
          }
        />
      </div>

      <Card className="p-4">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="label-caps">Fuel economy · {label}</h2>
          <span className="flex items-center gap-3 text-xs text-faint">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded bg-accent-line" /> per tank
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-4 border-t-2 border-dashed border-muted" /> average
            </span>
          </span>
        </div>
        {stats.readings.length >= 2 && stats.average ? (
          <>
            <EconomyChart readings={stats.readings} average={stats.average} unit={unit} />
            <p className="num mt-3 text-sm text-muted">
              {stats.readings.length} full-to-full readings from{' '}
              {formatDate(stats.readings[0].date)}: average {formatEconomy(stats.average, unit)},
              best {formatEconomy(stats.best?.kmpl ?? 0, unit)}, latest{' '}
              {formatEconomy(stats.latest?.kmpl ?? 0, unit)}.
            </p>
          </>
        ) : (
          <p className="py-8 text-center text-sm text-muted">
            {stats.fullCount < 2
              ? `Log ${2 - stats.fullCount} more full-tank fill${stats.fullCount === 1 ? '' : 's'} to see your economy.`
              : 'One more full tank and the trend line appears.'}
            {stats.readings.length === 1 &&
              stats.latest &&
              ` First reading: ${formatEconomy(stats.latest.kmpl, unit)}.`}
          </p>
        )}
      </Card>

      {prices.length >= 2 && (
        <Card className="p-4">
          <h2 className="label-caps mb-2">Price per litre</h2>
          <PriceChart points={prices} />
          <p className="num mt-2 text-sm text-muted">
            Last paid {formatMoneyPrecise(lastPrice ?? 0)}/l
            {prevPrice !== undefined &&
              lastPrice !== prevPrice &&
              ` (${lastPrice > prevPrice ? 'up' : 'down'} from ${formatMoneyPrecise(prevPrice)})`}
            ; average {formatMoneyPrecise(stats.avgPricePerLitre ?? 0)}/l across{' '}
            {formatMoney(stats.totalAmount)} spent.
          </p>
        </Card>
      )}

      <section aria-labelledby="fills-title">
        <div className="mb-3 flex items-center justify-between gap-2">
          <SectionTitle id="fills-title">Fill-ups · {entries.length}</SectionTitle>
          <Button size="sm" onClick={() => openLog('fuel', bike.id)}>
            <Plus /> Log fill-up
          </Button>
        </div>
        <Card>
          <ul className="divide-y divide-line">
            {newest.slice(0, limit).map((e) => {
              const r = readingById.get(e.id);
              return (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => openEditor({ kind: 'fuel', id: e.id })}
                    className="num flex min-h-14 w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left hover:bg-well/60"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 text-sm font-semibold">
                        {e.litres.toFixed(2)} l · {formatMoney(e.amount)}
                        {!e.fullTank && (
                          <span className="rounded-md bg-well px-1.5 py-0.5 text-[0.6875rem] font-semibold text-muted">
                            Partial
                          </span>
                        )}
                      </span>
                      <span className="block truncate text-xs text-faint">
                        {formatDate(e.date)} · {formatKm(e.odometer)}
                        {e.station && ` · ${e.station}`}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      {r ? (
                        <span className="font-display text-xl font-semibold">
                          {fmt(r.kmpl)}
                          <span className="ml-0.5 text-xs text-muted">{label}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-faint">—</span>
                      )}
                      <span className="block text-xs text-faint">
                        {formatMoneyPrecise(pricePerLitre(e))}/l
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>
        {newest.length > limit && (
          <Button
            variant="ghost"
            className="mt-2 w-full"
            onClick={() => setLimit((l) => l + PAGE * 3)}
          >
            Show more ({newest.length - limit} older)
          </Button>
        )}
      </section>
    </div>
  );
}
