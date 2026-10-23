import { ChartColumn, Plus, Settings as SettingsIcon, Warehouse } from 'lucide-react';
import { useMemo } from 'react';
import { NavLink, useLocation } from 'react-router';
import { attentionList } from '@/lib/garage';
import { cn } from '@/lib/utils';
import { useData, useToday } from '@/store/hooks';
import { useOpenLog } from '@/store/useOpenLog';
import { healthOf } from '@/lib/garage';
import { BikeSwatch } from './BikeSwatch';
import { Logo } from './Logo';
import { StatusIcon } from './StatusBadge';
import { Button } from './ui/button';

const LINKS = [
  { to: '/', label: 'Garage', icon: Warehouse, end: true },
  { to: '/costs', label: 'Costs', icon: ChartColumn, end: false },
  { to: '/settings', label: 'Settings', icon: SettingsIcon, end: false },
];

/** Mobile bottom tab bar: Garage, Log +, Costs, Settings. */
export function BottomNav() {
  const openLog = useOpenLog();
  const { pathname } = useLocation();
  const item = (l: (typeof LINKS)[number]) => (
    <NavLink
      key={l.to}
      to={l.to}
      end={l.end}
      className={({ isActive }) =>
        cn(
          'flex h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[0.6875rem] font-semibold tracking-wide transition-colors',
          isActive || (l.to === '/' && pathname.startsWith('/bikes'))
            ? 'text-fg'
            : 'text-faint hover:text-muted',
        )
      }
    >
      {({ isActive }) => (
        <>
          <l.icon
            aria-hidden
            className={cn(
              'size-[1.375rem]',
              (isActive || (l.to === '/' && pathname.startsWith('/bikes'))) && 'text-accent-ink',
            )}
          />
          {l.label}
        </>
      )}
    </NavLink>
  );
  return (
    <nav
      aria-label="Main"
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg-raised/90 backdrop-blur-lg md:hidden"
    >
      <div className="mx-auto flex max-w-lg items-stretch px-2">
        {item(LINKS[0])}
        <div className="flex flex-1 items-start justify-center">
          <button
            type="button"
            onClick={() => openLog()}
            className="-mt-5 flex h-14 cursor-pointer items-center gap-1.5 rounded-full bg-accent px-5 font-display text-lg font-bold tracking-wide text-on-accent uppercase shadow-[0_8px_24px_-6px_color-mix(in_oklab,var(--accent)_70%,transparent)] ring-4 ring-bg transition-transform active:scale-95"
          >
            Log <Plus aria-hidden className="size-5" strokeWidth={3} />
          </button>
        </div>
        {item(LINKS[1])}
        {item(LINKS[2])}
      </div>
    </nav>
  );
}

/** Desktop sidebar with nav and a live list of bikes. */
export function Sidebar() {
  const openLog = useOpenLog();
  const data = useData();
  const today = useToday();
  const attention = useMemo(() => attentionList(data, today), [data, today]);
  return (
    <aside className="sticky top-0 hidden h-dvh flex-col gap-6 border-r border-line bg-bg-raised px-4 py-6 md:flex">
      <NavLink to="/" className="px-2" aria-label="Kickstand home">
        <Logo />
      </NavLink>
      <Button
        size="lg"
        onClick={() => openLog()}
        className="w-full font-display text-lg tracking-wide uppercase"
      >
        <Plus strokeWidth={3} /> Log
      </Button>
      <nav aria-label="Main" className="flex flex-col gap-1">
        {LINKS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) =>
              cn(
                'flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors',
                isActive ? 'bg-well text-fg' : 'text-muted hover:bg-well/60 hover:text-fg',
              )
            }
          >
            <l.icon aria-hidden className="size-5" />
            {l.label}
          </NavLink>
        ))}
      </nav>
      {data.bikes.length > 0 && (
        <div className="flex min-h-0 flex-col gap-1">
          <p className="label-caps px-3 pb-1">Bikes</p>
          {data.bikes.map((b) => {
            const h = healthOf(data, b, today);
            const docsDue = attention.some((r) => r.bike.id === b.id && r.kind === 'doc');
            const status = h.overdue ? 'Overdue' : h.dueSoon || docsDue ? 'DueSoon' : 'OK';
            return (
              <NavLink
                key={b.id}
                to={`/bikes/${b.id}`}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm transition-colors',
                    isActive ? 'bg-well text-fg' : 'text-muted hover:bg-well/60 hover:text-fg',
                  )
                }
              >
                <BikeSwatch colour={b.colour} />
                <span className="min-w-0 flex-1 truncate font-medium">{b.nickname}</span>
                <StatusIcon status={status} />
                <span className="sr-only">
                  {status === 'OK'
                    ? 'all OK'
                    : status === 'Overdue'
                      ? 'has overdue items'
                      : 'has items due soon'}
                </span>
              </NavLink>
            );
          })}
          <NavLink
            to="/bikes/new"
            className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-faint hover:bg-well/60 hover:text-fg"
          >
            <Plus aria-hidden className="size-4" /> Add bike
          </NavLink>
        </div>
      )}
      <p className="mt-auto px-3 text-xs text-faint">Demo · data stays on this device</p>
    </aside>
  );
}
