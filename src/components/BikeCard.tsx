import type { ReactNode } from 'react';
import { ChevronRight, Fuel, Gauge, Route as RouteIcon, Wrench } from 'lucide-react';
import { Link } from 'react-router';
import type { Health } from '@/lib/due';
import type { ItemView } from '@/lib/garage';
import type { Bike } from '@/lib/types';
import { cn } from '@/lib/utils';
import { usePulse } from '@/store/ui';
import { useOpenLog } from '@/store/useOpenLog';
import { HealthGauge } from './HealthGauge';
import { Odometer } from './Odometer';
import { StatusIcon, statusText, statusVar } from './StatusBadge';

interface BikeCardProps {
  bike: Bike;
  health: Health;
  /** Most urgent enabled item, shown as the card's headline status. */
  top?: ItemView;
}

/** Instrument-cluster card: tinted with the bike's colour, odometer, health gauge, quick actions. */
export function BikeCard({ bike, health, top }: BikeCardProps) {
  const openLog = useOpenLog();
  const pulsing = usePulse(bike.id);
  const status = top && top.info.status !== 'OK' ? top.info.status : 'OK';

  return (
    <article
      aria-labelledby={`bike-${bike.id}-name`}
      className={cn(
        'relative overflow-hidden rounded-[var(--radius-card)] border border-line bg-card shadow-card',
        pulsing && 'animate-pulse-once',
      )}
      style={{
        backgroundImage: `radial-gradient(120% 90% at 0% 0%, color-mix(in oklab, ${bike.colour} 26%, transparent), transparent 60%)`,
        ['--pulse-colour' as string]: statusVar[status],
      }}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1"
        style={{ background: bike.colour }}
      />
      <Link
        to={`/bikes/${bike.id}`}
        className="group flex items-start gap-3 p-4 pb-3 pl-5 outline-offset-[-2px]"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-muted">
            {bike.year} {bike.make} {bike.model}
          </p>
          <h3
            id={`bike-${bike.id}-name`}
            className="mt-0.5 flex items-center gap-1 font-display text-3xl leading-tight font-semibold"
          >
            <span className="truncate">{bike.nickname}</span>
            <ChevronRight
              aria-hidden
              className="size-5 shrink-0 text-faint transition-transform group-hover:translate-x-0.5"
            />
          </h3>
          <Odometer value={bike.odometer} size="sm" className="mt-2" />
        </div>
        <HealthGauge health={health} size={84} />
      </Link>

      <div className="mx-4 ml-5 flex min-h-11 items-center gap-2 rounded-xl border border-line bg-well/80 px-3 py-2 text-sm">
        <StatusIcon status={status} />
        <span
          className={cn(
            'min-w-0 flex-1 font-medium',
            status !== 'OK' ? statusText[status] : 'text-muted',
          )}
        >
          {status === 'OK'
            ? top
              ? `All good. ${top.message}`
              : 'No schedule items yet'
            : top?.message}
        </span>
        {health.overdue + health.dueSoon > 1 && (
          <span className="num shrink-0 text-xs text-faint">
            +{health.overdue + health.dueSoon - 1} more
          </span>
        )}
      </div>

      <div
        className="grid grid-cols-4 gap-1 p-2 pl-3"
        role="group"
        aria-label={`Quick log for ${bike.nickname}`}
      >
        <QuickAction
          icon={<Fuel />}
          label="+Fuel"
          srSuffix={` for ${bike.nickname}`}
          onClick={() => openLog('fuel', bike.id)}
        />
        <QuickAction
          icon={<RouteIcon />}
          label="+Ride"
          srSuffix={` for ${bike.nickname}`}
          onClick={() => openLog('ride', bike.id)}
        />
        <QuickAction
          icon={<Wrench />}
          label="+Service"
          srSuffix={` for ${bike.nickname}`}
          onClick={() => openLog('service', bike.id)}
        />
        <QuickAction
          icon={<Gauge />}
          label="Odo"
          srSuffix={`meter update for ${bike.nickname}`}
          onClick={() => openLog('odometer', bike.id)}
        />
      </div>
    </article>
  );
}

function QuickAction({
  icon,
  label,
  srSuffix,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  srSuffix: string;
  onClick(): void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-12 cursor-pointer items-center justify-center gap-1.5 rounded-xl text-sm font-semibold text-muted transition-colors hover:bg-well hover:text-fg active:scale-95 [&_svg]:size-4"
    >
      <span aria-hidden className="text-accent-ink">
        {icon}
      </span>
      <span>
        {label}
        <span className="sr-only">{srSuffix}</span>
      </span>
    </button>
  );
}
