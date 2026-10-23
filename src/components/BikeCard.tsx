import { Link } from 'react-router';
import type { Health } from '@/lib/due';
import { isScooterSchedule, type ItemView } from '@/lib/garage';
import type { Bike } from '@/lib/types';
import { cn } from '@/lib/utils';
import { usePulse } from '@/store/ui';
import { BikeActions } from './BikeActions';
import { BikeAvatar } from './BikeAvatar';
import { HealthStrip } from './HealthStrip';
import { Odometer } from './Odometer';
import { StatusIcon, statusText, statusVar } from './StatusBadge';

interface BikeCardProps {
  bike: Bike;
  health: Health;
  /** The bike's schedule, most urgent first. */
  items: ItemView[];
}

export function BikeCard({ bike, health, items }: BikeCardProps) {
  const pulsing = usePulse(bike.id);
  const enabled = items.filter((v) => v.item.enabled);
  const top = enabled[0];
  const status = top && top.info.status !== 'OK' ? top.info.status : 'OK';
  const needing = health.overdue + health.dueSoon;

  return (
    <article
      aria-labelledby={`bike-${bike.id}-name`}
      className={cn(
        'rounded-[var(--radius-card)] border border-line bg-card p-4 shadow-card',
        pulsing && 'animate-pulse-once',
      )}
      style={{ ['--pulse-colour' as string]: statusVar[status] }}
    >
      <Link
        to={`/bikes/${bike.id}`}
        className="-m-2 flex items-center gap-3 rounded-2xl p-2 hover:bg-well/50"
      >
        <BikeAvatar
          colour={bike.colour}
          scooter={isScooterSchedule(items.map((v) => v.item.name))}
        />
        <div className="min-w-0 flex-1">
          <h3
            id={`bike-${bike.id}-name`}
            className="truncate text-[1.0625rem] leading-snug font-semibold"
          >
            {bike.nickname}
          </h3>
          <p className="truncate text-sm text-muted">
            {bike.year} {bike.model}
          </p>
        </div>
        <Odometer value={bike.odometer} className="shrink-0 text-xl" />
      </Link>

      <div className="mt-4">
        <HealthStrip items={items} />
        <p className="mt-2.5 flex items-start gap-2 text-sm leading-snug">
          <StatusIcon status={status} className="mt-px" />
          {status === 'OK' ? (
            <span className="text-muted">
              {top ? `All good · ${top.message}` : 'No schedule yet'}
            </span>
          ) : (
            <span>
              <span className={cn('font-medium', statusText[status])}>{top?.message}</span>
              {needing > 1 && <span className="text-faint"> · +{needing - 1} more</span>}
            </span>
          )}
        </p>
      </div>

      <BikeActions bike={bike} className="mt-4" />
    </article>
  );
}
