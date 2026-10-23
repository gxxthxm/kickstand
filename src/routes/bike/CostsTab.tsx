import { useMemo } from 'react';
import { Wallet } from 'lucide-react';
import {
  COST_CATEGORIES,
  COST_LABELS,
  costBreakdown,
  dataSpanDays,
  monthlyCosts,
} from '@/lib/costs';
import { formatMoney, formatMoneyPrecise } from '@/lib/format';
import type { Bike } from '@/lib/types';
import { useData, useToday } from '@/store/hooks';
import MonthlyCostChart, { CATEGORY_COLOUR } from '@/components/charts/MonthlyCostChart';
import { EmptyState } from '@/components/PageHeader';
import { StatTile } from '@/components/StatTile';
import { Card } from '@/components/ui/card';

export default function CostsTab({ bike }: { bike: Bike }) {
  const data = useData();
  const today = useToday();
  const c = useMemo(() => costBreakdown(data, bike.id), [data, bike.id]);
  const months = useMemo(() => monthlyCosts(data, today, 12, bike.id), [data, today, bike.id]);
  const span = useMemo(() => dataSpanDays(data, bike.id), [data, bike.id]);

  if (c.total === 0) {
    return (
      <EmptyState icon={<Wallet />} title="No costs yet">
        Fuel, services and document renewals you log show up here, with cost per km.
      </EmptyState>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile
          label="Running cost"
          value={formatMoney(c.total)}
          sub="fuel, service, parts, papers"
        />
        <StatTile
          label="Cost per km"
          value={c.costPerKm ? formatMoneyPrecise(c.costPerKm) : '—'}
          sub={`over ${c.kmTracked.toLocaleString('en-IN')} km logged`}
        />
        <StatTile
          label="Purchase"
          value={bike.purchasePrice ? formatMoney(bike.purchasePrice) : '—'}
          sub={`bought ${bike.purchaseDate.slice(0, 4)}`}
        />
        <StatTile
          label="Total ownership"
          value={formatMoney(c.total + (bike.purchasePrice ?? 0))}
          sub={bike.purchasePrice ? 'purchase + running' : 'add purchase price in Edit bike'}
        />
      </div>

      <Card className="p-4">
        <h2 className="label-caps mb-3">Breakdown</h2>
        <div className="flex h-4 overflow-hidden rounded-full bg-well" aria-hidden>
          {COST_CATEGORIES.map((k) => (
            <span
              key={k}
              style={{ width: `${(c[k] / c.total) * 100}%`, background: CATEGORY_COLOUR[k] }}
            />
          ))}
        </div>
        <dl className="num mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
          {COST_CATEGORIES.map((k) => (
            <div key={k}>
              <dt className="flex items-center gap-1.5 text-xs text-muted">
                <span
                  aria-hidden
                  className="size-2.5 rounded-sm"
                  style={{ background: CATEGORY_COLOUR[k] }}
                />
                {COST_LABELS[k]}
              </dt>
              <dd className="font-display text-xl font-semibold">
                {formatMoney(c[k])}{' '}
                <span className="text-xs font-normal text-faint">
                  {Math.round((c[k] / c.total) * 100)}%
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card className="p-4">
        <h2 className="label-caps mb-3">Last 12 months</h2>
        {span < 30 ? (
          <p className="py-6 text-center text-sm text-muted">
            Under a month of data so far — the monthly chart fills in as you log.
          </p>
        ) : (
          <>
            <MonthlyCostChart months={months} height={220} />
            <ChartSummary months={months} />
          </>
        )}
      </Card>
    </div>
  );
}

export function ChartSummary({ months }: { months: ReturnType<typeof monthlyCosts> }) {
  const total = months.reduce((s, m) => s + m.total, 0);
  const peak = months.reduce((p, m) => (m.total > p.total ? m : p), months[0]);
  return (
    <p className="num mt-3 text-sm text-muted">
      {formatMoney(total)} over 12 months, about {formatMoney(total / 12)} a month. Highest was{' '}
      {peak.label} at {formatMoney(peak.total)}.
    </p>
  );
}
