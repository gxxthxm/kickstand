import { useMemo } from 'react';
import { Wallet } from 'lucide-react';
import { Link } from 'react-router';
import {
  COST_CATEGORIES,
  COST_LABELS,
  costBreakdown,
  dataSpanDays,
  monthlyCosts,
} from '@/lib/costs';
import { formatMoney, formatMoneyPrecise } from '@/lib/format';
import { useData, useToday } from '@/store/hooks';
import { BikeSwatch } from '@/components/BikeSwatch';
import MonthlyCostChart, { CATEGORY_COLOUR } from '@/components/charts/MonthlyCostChart';
import { EmptyState, Page, PageHeader } from '@/components/PageHeader';
import { StatTile } from '@/components/StatTile';
import { Card, SectionTitle } from '@/components/ui/card';
import { ChartSummary } from './bike/CostsTab';

export default function Costs() {
  const data = useData();
  const today = useToday();
  const all = useMemo(() => costBreakdown(data), [data]);
  const months = useMemo(() => monthlyCosts(data, today), [data, today]);
  const span = useMemo(() => dataSpanDays(data), [data]);
  const perBike = useMemo(
    () =>
      data.bikes
        .map((bike) => ({ bike, c: costBreakdown(data, bike.id) }))
        .sort((a, b) => b.c.total - a.c.total),
    [data],
  );
  const year = months.reduce((s, m) => s + m.total, 0);
  const max = Math.max(1, ...perBike.map((p) => p.c.total));

  return (
    <Page>
      <PageHeader eyebrow="All bikes" title="Costs" />
      {all.total === 0 ? (
        <EmptyState icon={<Wallet />} title="Nothing spent yet">
          Fuel fill-ups, services and document renewals add up here, per bike and per km.
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatTile
              label="All time"
              value={formatMoney(all.total)}
              sub={`${data.bikes.length} bike${data.bikes.length === 1 ? '' : 's'}`}
            />
            <StatTile
              label="Last 12 months"
              value={formatMoney(year)}
              sub={`≈ ${formatMoney(year / 12)} / month`}
            />
            <StatTile
              label="Cost per km"
              value={all.costPerKm ? formatMoneyPrecise(all.costPerKm) : '—'}
              sub={`${all.kmTracked.toLocaleString('en-IN')} km logged`}
            />
            <StatTile
              label="Fuel share"
              value={`${Math.round((all.fuel / all.total) * 100)}%`}
              sub={formatMoney(all.fuel)}
            />
          </div>

          <Card className="p-4 sm:p-5">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <SectionTitle>Last 12 months</SectionTitle>
              <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
                {COST_CATEGORIES.map((c) => (
                  <li key={c} className="inline-flex items-center gap-1.5">
                    <span
                      aria-hidden
                      className="size-2.5 rounded-sm"
                      style={{ background: CATEGORY_COLOUR[c] }}
                    />
                    {COST_LABELS[c]}
                  </li>
                ))}
              </ul>
            </div>
            {span < 30 ? (
              <p className="py-10 text-center text-sm text-muted">
                Under a month of data so far — come back after a few more logs for the monthly
                trend.
              </p>
            ) : (
              <>
                <MonthlyCostChart months={months} />
                <ChartSummary months={months} />
              </>
            )}
          </Card>

          <section aria-labelledby="per-bike">
            <SectionTitle id="per-bike" className="mb-3">
              Per bike
            </SectionTitle>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {perBike.map(({ bike, c }) => (
                <Link
                  key={bike.id}
                  to={`/bikes/${bike.id}/costs`}
                  className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-4 transition-colors hover:border-line-strong"
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2">
                      <BikeSwatch colour={bike.colour} />
                      <span className="truncate font-semibold">{bike.nickname}</span>
                    </span>
                    <span className="num shrink-0 text-right">
                      <span className="font-display text-2xl font-semibold">
                        {formatMoney(c.total)}
                      </span>
                      <span className="block text-xs text-faint">
                        {c.costPerKm ? `${formatMoneyPrecise(c.costPerKm)}/km` : 'no distance yet'}
                      </span>
                    </span>
                  </span>
                  <span
                    className="flex h-3 overflow-hidden rounded-full bg-well"
                    style={{ width: `${Math.max(8, (c.total / max) * 100)}%` }}
                    aria-hidden
                  >
                    {COST_CATEGORIES.map((k) => (
                      <span
                        key={k}
                        style={{
                          width: `${c.total ? (c[k] / c.total) * 100 : 0}%`,
                          background: CATEGORY_COLOUR[k],
                        }}
                      />
                    ))}
                  </span>
                  <span className="num grid grid-cols-4 gap-2 text-xs text-muted">
                    {COST_CATEGORIES.map((k) => (
                      <span key={k} className="min-w-0">
                        <span className="block truncate text-faint">{COST_LABELS[k]}</span>
                        <span className="font-semibold text-fg">{formatMoney(c[k])}</span>
                      </span>
                    ))}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      )}
    </Page>
  );
}
