import { Fuel, Gauge, Route as RouteIcon, Wrench } from 'lucide-react';
import { formatEconomy } from '@/lib/fuel';
import { formatDate, formatKm, formatMoney } from '@/lib/format';
import type { Activity } from '@/lib/garage';
import type { GarageData } from '@/lib/types';
import { useEconomyUnit } from '@/store/hooks';
import { useUI } from '@/store/ui';
import { BikeSwatch } from './BikeSwatch';

const ICONS = { fuel: Fuel, ride: RouteIcon, service: Wrench, reading: Gauge } as const;

interface Props {
  a: Activity;
  data: GarageData;
  readings: Map<string, number>;
  /** Show which bike the log belongs to (garage-wide lists). */
  showBike?: boolean;
}

/** One log in a feed: fill-up, ride, service or odometer reading. Tap to edit. */
export function ActivityRow({ a, data, readings, showBike }: Props) {
  const openEditor = useUI((s) => s.openEditor);
  const unit = useEconomyUnit();
  const Icon = ICONS[a.kind];
  const bike = showBike ? data.bikes.find((b) => b.id === a.bikeId) : undefined;

  let title: string;
  let sub: string;
  if (a.kind === 'fuel') {
    const f = data.fuel.find((x) => x.id === a.id);
    const kmpl = readings.get(a.id);
    title = `${f?.litres.toFixed(2)} l ${f?.fullTank ? 'full tank' : 'top-up'}`;
    sub = [formatMoney(f?.amount ?? 0), kmpl && formatEconomy(kmpl, unit), f?.station]
      .filter(Boolean)
      .join(' · ');
  } else if (a.kind === 'ride') {
    const r = data.rides.find((x) => x.id === a.id);
    title = r?.title ?? 'Ride';
    sub = r ? [formatKm(r.endKm - r.startKm), ...r.tags].join(' · ') : '';
  } else if (a.kind === 'service') {
    const s = data.services.find((x) => x.id === a.id);
    const names =
      s?.itemIds.map((id) => data.schedule.find((i) => i.id === id)?.name).filter(Boolean) ?? [];
    title = names.length
      ? names.slice(0, 2).join(', ') + (names.length > 2 ? ` +${names.length - 2}` : '')
      : 'Service';
    sub = [
      s?.where,
      s && s.partsCost + s.labourCost > 0 ? formatMoney(s.partsCost + s.labourCost) : null,
    ]
      .filter(Boolean)
      .join(' · ');
  } else {
    title = 'Odometer reading';
    sub = formatKm(a.odometer);
  }

  return (
    <li>
      <button
        type="button"
        onClick={() => openEditor({ kind: a.kind, id: a.id })}
        className="flex min-h-14 w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left hover:bg-well/60"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-well text-accent-ink">
          <Icon aria-hidden className="size-[1.125rem]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{title}</span>
          <span className="num flex min-w-0 items-center gap-1.5 text-xs text-muted">
            {bike && (
              <>
                <BikeSwatch colour={bike.colour} className="size-2" />
                <span className="shrink-0">{bike.nickname}</span>
                <span aria-hidden>·</span>
              </>
            )}
            <span className="truncate">{sub}</span>
          </span>
        </span>
        <span className="num shrink-0 text-right text-xs text-faint">
          {formatDate(a.date)}
          <span className="block font-mono">{formatKm(a.odometer)}</span>
        </span>
      </button>
    </li>
  );
}
