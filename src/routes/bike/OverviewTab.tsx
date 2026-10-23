import { useMemo } from 'react';
import { ChevronRight, TrendingDown } from 'lucide-react';
import { Link } from 'react-router';
import { costBreakdown, monthlyCosts } from '@/lib/costs';
import type { Health } from '@/lib/due';
import { formatEconomy, fuelStats } from '@/lib/fuel';
import { formatDate, formatMoney, formatMoneyPrecise } from '@/lib/format';
import { activityFor, bikeDocs, bikeItems } from '@/lib/garage';
import type { Bike, GarageData } from '@/lib/types';
import { useData, useEconomyReadings, useEconomyUnit, useToday } from '@/store/hooks';
import { ActivityRow } from '@/components/ActivityRow';
import { ItemRow } from '@/components/ItemRow';
import { StatTile } from '@/components/StatTile';
import { StatusBadge } from '@/components/StatusBadge';
import { docAsItemStatus } from '@/lib/due';
import { Card, SectionTitle } from '@/components/ui/card';

export function OverviewTab({ bike, health }: { bike: Bike; health: Health }) {
  const data = useData();
  const today = useToday();
  const unit = useEconomyUnit();
  const items = useMemo(
    () => bikeItems(data, bike, today).filter((i) => i.item.enabled),
    [data, bike, today],
  );
  const fuel = useMemo(
    () => fuelStats(data.fuel.filter((f) => f.bikeId === bike.id)),
    [data.fuel, bike.id],
  );
  const year = useMemo(
    () => monthlyCosts(data, today, 12, bike.id).reduce((s, m) => s + m.total, 0),
    [data, today, bike.id],
  );
  const costs = useMemo(() => costBreakdown(data, bike.id), [data, bike.id]);
  const docs = useMemo(() => bikeDocs(data, bike.id, today), [data, bike.id, today]);
  const activity = useMemo(() => activityFor(data, bike.id).slice(0, 6), [data, bike.id]);
  const readings = useEconomyReadings(data.fuel);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <div className="flex min-w-0 flex-col gap-6">
        <section aria-labelledby="next-title">
          <div className="mb-3 flex items-baseline justify-between">
            <SectionTitle id="next-title">Next up</SectionTitle>
            <Link
              to={`/bikes/${bike.id}/service`}
              className="inline-flex min-h-11 items-center gap-0.5 text-sm font-semibold text-accent-ink"
            >
              Full schedule <ChevronRight className="size-4" />
            </Link>
          </div>
          {items.length ? (
            <Card>
              <ul className="divide-y divide-line">
                {items.slice(0, 3).map((v) => (
                  <ItemRow key={v.item.id} view={v} />
                ))}
              </ul>
            </Card>
          ) : (
            <p className="text-sm text-muted">No schedule items. Add some in the Service tab.</p>
          )}
          <p className="num mt-2 text-sm text-muted">
            {health.ok} of {health.total} items OK
            {health.overdue > 0 && ` · ${health.overdue} overdue`}
            {health.dueSoon > 0 && ` · ${health.dueSoon} due soon`}
          </p>
        </section>

        <section aria-labelledby="activity-title">
          <SectionTitle id="activity-title" className="mb-3">
            Recent activity
          </SectionTitle>
          {activity.length ? (
            <Card>
              <ul className="divide-y divide-line">
                {activity.map((a) => (
                  <ActivityRow key={`${a.kind}-${a.id}`} a={a} data={data} readings={readings} />
                ))}
              </ul>
            </Card>
          ) : (
            <p className="text-sm text-muted">
              Nothing logged yet. Use the buttons above to log fuel, a ride or a service.
            </p>
          )}
        </section>
      </div>

      <aside className="flex flex-col gap-3">
        {fuel.alert && fuel.latest && fuel.average && (
          <Link
            to={`/bikes/${bike.id}/fuel`}
            className="flex items-start gap-3 rounded-2xl border border-[color-mix(in_oklab,var(--soon)_45%,transparent)] bg-[color-mix(in_oklab,var(--soon)_10%,var(--card))] p-4"
          >
            <TrendingDown aria-hidden className="mt-0.5 size-5 shrink-0 text-soon" />
            <span className="text-sm">
              <span className="block font-semibold">
                Mileage dropped — check tyre pressure or chain
              </span>
              <span className="text-muted">
                Latest tank {formatEconomy(fuel.latest.kmpl, unit)},{' '}
                {Math.round((fuel.latestDrop ?? 0) * 100)}% worse than your average.
              </span>
            </span>
          </Link>
        )}
        <div className="grid grid-cols-2 gap-3">
          <StatTile
            label="Avg economy"
            value={fuel.average ? formatEconomy(fuel.average, unit).split(' ')[0] : '—'}
            unit={fuel.average ? formatEconomy(fuel.average, unit).split(' ')[1] : undefined}
            sub={
              fuel.latest ? `Latest ${formatEconomy(fuel.latest.kmpl, unit)}` : 'Needs 2 full tanks'
            }
          />
          <StatTile
            label="Last 12 months"
            value={formatMoney(year)}
            sub={costs.costPerKm ? `${formatMoneyPrecise(costs.costPerKm)}/km overall` : undefined}
          />
          <StatTile
            label="Km logged"
            value={costs.kmTracked.toLocaleString('en-IN')}
            unit="km"
            sub={`Since ${formatDate(firstDate(data, bike.id) ?? bike.purchaseDate)}`}
          />
          <StatTile
            label="Fill-ups"
            value={data.fuel.filter((f) => f.bikeId === bike.id).length}
            sub={
              fuel.avgPricePerLitre
                ? `${formatMoneyPrecise(fuel.avgPricePerLitre)}/l avg`
                : undefined
            }
          />
        </div>
        {docs.length > 0 && (
          <Card className="p-4">
            <div className="mb-2 flex items-baseline justify-between">
              <h3 className="label-caps">Papers</h3>
              <Link
                to={`/bikes/${bike.id}/docs`}
                className="inline-flex min-h-11 items-center text-sm font-semibold text-accent-ink"
              >
                All docs
              </Link>
            </div>
            <ul className="flex flex-col gap-2">
              {docs.map(({ doc, info, message }) => (
                <li key={doc.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate">{message}</span>
                  <StatusBadge status={docAsItemStatus(info.status)} label={info.status} />
                </li>
              ))}
            </ul>
          </Card>
        )}
      </aside>
    </div>
  );
}

function firstDate(data: GarageData, bikeId: string): string | undefined {
  return data.readings
    .filter((r) => r.bikeId === bikeId)
    .map((r) => r.date)
    .sort()[0];
}
