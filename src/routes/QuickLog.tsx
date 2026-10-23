import type { ReactNode } from 'react';
import { Fuel, Gauge, Route as RouteIcon, Wrench } from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { cn } from '@/lib/utils';
import { useGarage } from '@/store/garage';
import type { LogType, ModalState } from '@/store/useOpenLog';
import { BikeSwatch } from '@/components/BikeSwatch';
import { FuelForm } from '@/components/forms/FuelForm';
import { OdometerForm } from '@/components/forms/OdometerForm';
import { RideForm } from '@/components/forms/RideForm';
import { ServiceForm } from '@/components/forms/ServiceForm';
import { Button } from '@/components/ui/button';
import { Segmented } from '@/components/ui/segmented';
import { Sheet, SheetContent } from '@/components/ui/sheet';

const TYPES: { value: LogType; label: string; icon: ReactNode }[] = [
  { value: 'fuel', label: 'Fuel', icon: <Fuel /> },
  { value: 'ride', label: 'Ride', icon: <RouteIcon /> },
  { value: 'service', label: 'Service', icon: <Wrench /> },
  { value: 'odometer', label: 'Odo', icon: <Gauge /> },
];

const isType = (t: string | null): t is LogType => TYPES.some((x) => x.value === t);

/** `/log` — the quick-log bottom sheet, layered over whatever screen opened it. */
export function QuickLog() {
  const location = useLocation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const bikes = useGarage((s) => s.bikes);
  const open = location.pathname === '/log';

  const typeParam = params.get('type');
  const type: LogType = isType(typeParam) ? typeParam : 'fuel';
  const bikeId = bikes.some((b) => b.id === params.get('bike'))
    ? (params.get('bike') as string)
    : bikes[0]?.id;

  const update = (next: { type?: LogType; bike?: string }) => {
    const p = new URLSearchParams(params);
    if (next.type) p.set('type', next.type);
    if (next.bike) p.set('bike', next.bike);
    setParams(p, { replace: true, state: location.state });
  };

  const close = () => {
    const bg = (location.state as ModalState | null)?.background;
    if (bg) navigate(-1);
    else navigate('/', { replace: true });
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && close()}>
      {open && (
        <SheetContent title="Quick log" hideTitle className="md:max-w-xl">
          {bikes.length === 0 ? (
            <div className="py-8 text-center">
              <p className="font-display text-2xl font-semibold">No bikes yet</p>
              <p className="mt-1 text-sm text-muted">
                Add a bike first, then log fuel, rides and services against it.
              </p>
              <Button className="mt-5" onClick={() => navigate('/bikes/new', { replace: true })}>
                Add a bike
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <Segmented
                label="What are you logging?"
                size="lg"
                value={type}
                onValueChange={(t) => update({ type: t })}
                options={TYPES.map((t) => ({
                  ...t,
                  label:
                    t.value === 'odometer' ? (
                      <span>
                        <span className="sm:hidden">Odo</span>
                        <span className="hidden sm:inline">Odometer</span>
                      </span>
                    ) : (
                      t.label
                    ),
                }))}
              />
              {bikes.length > 1 && (
                <div
                  role="radiogroup"
                  aria-label="Bike"
                  className="scrollbar-none -mx-5 flex gap-2 overflow-x-auto px-5"
                >
                  {bikes.map((b) => {
                    const on = b.id === bikeId;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => update({ bike: b.id })}
                        className={cn(
                          'flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full border px-3.5 text-sm font-semibold transition-colors',
                          on
                            ? 'border-transparent text-fg'
                            : 'border-line text-muted hover:text-fg',
                        )}
                        style={
                          on
                            ? {
                                background: `color-mix(in oklab, ${b.colour} 24%, var(--well))`,
                                borderColor: b.colour,
                              }
                            : undefined
                        }
                      >
                        <BikeSwatch colour={b.colour} />
                        {b.nickname}
                      </button>
                    );
                  })}
                </div>
              )}
              {bikeId && (
                <div key={`${type}-${bikeId}`}>
                  {type === 'fuel' && <FuelForm bikeId={bikeId} onDone={close} />}
                  {type === 'ride' && <RideForm bikeId={bikeId} onDone={close} />}
                  {type === 'service' && <ServiceForm bikeId={bikeId} onDone={close} />}
                  {type === 'odometer' && <OdometerForm bikeId={bikeId} onDone={close} />}
                </div>
              )}
            </div>
          )}
        </SheetContent>
      )}
    </Sheet>
  );
}
