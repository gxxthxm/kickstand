import type { ReactNode } from 'react';
import { Fuel, Gauge, Route as RouteIcon, Wrench } from 'lucide-react';
import type { Bike } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useOpenLog } from '@/store/useOpenLog';

/** Log fuel (the everyday action) plus ride, service and odometer as icon buttons. */
export function BikeActions({ bike, className }: { bike: Bike; className?: string }) {
  const openLog = useOpenLog();
  return (
    <div
      className={cn('flex gap-2', className)}
      role="group"
      aria-label={`Log for ${bike.nickname}`}
    >
      <button
        type="button"
        onClick={() => openLog('fuel', bike.id)}
        className="flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-well text-sm font-semibold transition-colors hover:bg-line active:scale-[0.98] sm:max-w-48"
      >
        <Fuel aria-hidden className="size-4" />
        Log fuel
        <span className="sr-only"> for {bike.nickname}</span>
      </button>
      <IconAction label={`Log ride for ${bike.nickname}`} onClick={() => openLog('ride', bike.id)}>
        <RouteIcon />
      </IconAction>
      <IconAction
        label={`Log service for ${bike.nickname}`}
        onClick={() => openLog('service', bike.id)}
      >
        <Wrench />
      </IconAction>
      <IconAction
        label={`Update odometer for ${bike.nickname}`}
        onClick={() => openLog('odometer', bike.id)}
      >
        <Gauge />
      </IconAction>
    </div>
  );
}

function IconAction({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick(): void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full bg-well text-muted transition-colors hover:bg-line hover:text-fg active:scale-95 [&_svg]:size-[1.125rem]"
    >
      {children}
    </button>
  );
}
