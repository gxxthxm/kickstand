import { useMemo, useState } from 'react';
import { Plus, Route as RouteIcon, Star } from 'lucide-react';
import { formatDate, formatKm } from '@/lib/format';
import { RIDE_TAGS, type Bike } from '@/lib/types';
import { useGarage } from '@/store/garage';
import { useUI } from '@/store/ui';
import { useOpenLog } from '@/store/useOpenLog';
import { EmptyState } from '@/components/PageHeader';
import { StatTile } from '@/components/StatTile';
import { Button } from '@/components/ui/button';
import { SectionTitle } from '@/components/ui/card';
import { Chip } from '@/components/ui/segmented';

export function RidesTab({ bike }: { bike: Bike }) {
  const allRides = useGarage((s) => s.rides);
  const openEditor = useUI((s) => s.openEditor);
  const openLog = useOpenLog();
  const [tag, setTag] = useState<string | null>(null);

  const rides = useMemo(
    () => allRides.filter((r) => r.bikeId === bike.id).sort((a, b) => (a.date < b.date ? 1 : -1)),
    [allRides, bike.id],
  );
  const shown = tag ? rides.filter((r) => r.tags.includes(tag)) : rides;
  const total = shown.reduce((s, r) => s + (r.endKm - r.startKm), 0);
  const rated = shown.filter((r) => r.rating);
  const longest = shown.reduce<(typeof rides)[number] | undefined>(
    (m, r) => (!m || r.endKm - r.startKm > m.endKm - m.startKm ? r : m),
    undefined,
  );

  if (rides.length === 0) {
    return (
      <EmptyState
        icon={<RouteIcon />}
        title="No rides yet"
        actions={
          <Button onClick={() => openLog('ride', bike.id)}>
            <Plus /> Log a ride
          </Button>
        }
      >
        Log weekend trips and commutes — each one moves the odometer, so what's due stays current.
      </EmptyState>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-3 gap-3">
        <StatTile size="sm" label="Distance" value={total.toLocaleString('en-IN')} unit="km" />
        <StatTile size="sm" label="Rides" value={shown.length} />
        <StatTile
          label="Avg rating"
          value={
            rated.length
              ? (rated.reduce((s, r) => s + (r.rating ?? 0), 0) / rated.length).toFixed(1)
              : '—'
          }
          unit={rated.length ? '★' : undefined}
        />
      </div>
      {longest && (
        <p className="text-sm text-muted">
          Longest: <span className="font-semibold text-fg">{longest.title}</span> ·{' '}
          {formatKm(longest.endKm - longest.startKm)}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle>Ride log</SectionTitle>
        <Button size="sm" onClick={() => openLog('ride', bike.id)}>
          <Plus /> Log ride
        </Button>
      </div>
      <div
        role="group"
        aria-label="Filter by tag"
        className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0"
      >
        <Chip pressed={tag === null} onPressedChange={() => setTag(null)} className="shrink-0">
          All
        </Chip>
        {RIDE_TAGS.map((t) => (
          <Chip
            key={t}
            pressed={tag === t}
            onPressedChange={(p) => setTag(p ? t : null)}
            className="shrink-0"
          >
            {t}
          </Chip>
        ))}
      </div>
      {shown.length === 0 ? (
        <p className="text-sm text-muted">No {tag} rides yet.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {shown.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => openEditor({ kind: 'ride', id: r.id })}
                className="flex h-full w-full cursor-pointer flex-col gap-2 rounded-2xl border border-line bg-card p-4 text-left transition-colors hover:border-line-strong"
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block text-xs text-faint">{formatDate(r.date)}</span>
                    <span className="block font-semibold">{r.title}</span>
                  </span>
                  <span className="shrink-0 font-display text-2xl leading-none font-semibold">
                    {(r.endKm - r.startKm).toLocaleString('en-IN')}
                    <span className="ml-0.5 text-sm text-muted">km</span>
                  </span>
                </span>
                <span className="flex flex-wrap items-center gap-1.5">
                  {r.rating && (
                    <span
                      className="mr-1 inline-flex items-center gap-0.5"
                      role="img"
                      aria-label={`${r.rating} out of 5 stars`}
                    >
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          aria-hidden
                          className={
                            i < (r.rating ?? 0)
                              ? 'size-3.5 fill-soon text-soon'
                              : 'size-3.5 text-line-strong'
                          }
                        />
                      ))}
                    </span>
                  )}
                  {r.tags.map((t) => (
                    <span key={t} className="rounded-md bg-well px-2 py-0.5 text-xs text-muted">
                      {t}
                    </span>
                  ))}
                  <span className="num ml-auto text-xs text-faint">
                    {formatKm(r.startKm)} → {r.endKm.toLocaleString('en-IN')}
                  </span>
                </span>
                {r.notes && <span className="line-clamp-2 text-sm text-muted">{r.notes}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
