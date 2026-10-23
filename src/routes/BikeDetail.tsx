import { lazy, Suspense, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Fuel, Gauge, Pencil, Route as RouteIcon, Wrench } from 'lucide-react';
import { Tabs } from 'radix-ui';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { healthOf } from '@/lib/garage';
import { useBike, useData, useToday } from '@/store/hooks';
import { useOpenLog } from '@/store/useOpenLog';
import { HealthGauge } from '@/components/HealthGauge';
import { Odometer } from '@/components/Odometer';
import { Page } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { OverviewTab } from './bike/OverviewTab';
import { ServiceTab } from './bike/ServiceTab';
import { RidesTab } from './bike/RidesTab';
import { DocsTab } from './bike/DocsTab';

const FuelTab = lazy(() => import('./bike/FuelTab'));
const CostsTab = lazy(() => import('./bike/CostsTab'));

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'service', label: 'Service' },
  { value: 'fuel', label: 'Fuel' },
  { value: 'rides', label: 'Rides' },
  { value: 'docs', label: 'Docs' },
  { value: 'costs', label: 'Costs' },
] as const;
type TabValue = (typeof TABS)[number]['value'];

export default function BikeDetail() {
  const { id, tab: tabParam } = useParams();
  const navigate = useNavigate();
  const bike = useBike(id);
  const data = useData();
  const today = useToday();
  const openLog = useOpenLog();
  const tab: TabValue = TABS.some((t) => t.value === tabParam)
    ? (tabParam as TabValue)
    : 'overview';

  // Slide direction follows tab order.
  const [prevTab, setPrevTab] = useState(tab);
  const [direction, setDirection] = useState(1);
  if (tab !== prevTab) {
    const index = (v: TabValue) => TABS.findIndex((t) => t.value === v);
    setDirection(index(tab) > index(prevTab) ? 1 : -1);
    setPrevTab(tab);
  }

  const health = useMemo(
    () => (bike ? healthOf(data, bike, today) : undefined),
    [data, bike, today],
  );
  if (!bike || !health) return <Navigate to="/" replace />;

  return (
    <div>
      <div
        className="border-b border-line"
        style={{
          backgroundImage: `radial-gradient(90% 120% at 0% 0%, color-mix(in oklab, ${bike.colour} 30%, transparent), transparent 70%)`,
        }}
      >
        <Page className="pt-3 pb-5 md:pt-6">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-full pr-3 pl-1 text-sm font-semibold text-muted hover:text-fg"
            >
              <ChevronLeft className="size-5" /> Garage
            </Link>
            <Button asChild variant="ghost" size="sm">
              <Link to={`/bikes/${bike.id}/edit`}>
                <Pencil /> Edit bike
              </Link>
            </Button>
          </div>
          <div className="mt-2 flex items-center gap-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-muted">
                {bike.year} {bike.make} {bike.model}
              </p>
              <h1 className="font-display text-[2.5rem] leading-[0.92] font-bold tracking-wide break-words uppercase sm:text-5xl md:text-6xl">
                {bike.nickname}
              </h1>
              <Odometer value={bike.odometer} size="md" className="mt-3" />
            </div>
            <HealthGauge health={health} size={104} />
          </div>
          <div
            className="mt-5 grid grid-cols-4 gap-2 sm:flex"
            role="group"
            aria-label={`Log for ${bike.nickname}`}
          >
            {(
              [
                ['fuel', 'Fuel', Fuel, 'Log fuel'],
                ['ride', 'Ride', RouteIcon, 'Log ride'],
                ['service', 'Service', Wrench, 'Log service'],
                ['odometer', 'Odometer', Gauge, 'Update odometer'],
              ] as const
            ).map(([type, label, Icon, aria]) => (
              <button
                key={type}
                type="button"
                onClick={() => openLog(type, bike.id)}
                aria-label={aria}
                className="flex h-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border border-line bg-well/80 text-xs font-semibold transition-colors hover:border-line-strong active:scale-95 sm:h-11 sm:flex-row sm:gap-2 sm:rounded-full sm:px-4 sm:text-sm"
              >
                <Icon aria-hidden className="size-5 text-accent-ink sm:size-4" />
                <span aria-hidden>{label}</span>
              </button>
            ))}
          </div>
        </Page>
      </div>

      <Tabs.Root
        value={tab}
        onValueChange={(v) =>
          navigate(`/bikes/${bike.id}/${v === 'overview' ? '' : v}`, { replace: true })
        }
      >
        <div className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur-lg">
          <Page>
            <Tabs.List
              aria-label={`${bike.nickname} sections`}
              className="scrollbar-none -mx-4 flex overflow-x-auto px-4 sm:mx-0 sm:px-0"
            >
              {TABS.map((t) => (
                <Tabs.Trigger
                  key={t.value}
                  value={t.value}
                  className="relative h-12 shrink-0 cursor-pointer px-3.5 text-sm font-semibold text-faint transition-colors after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full hover:text-fg data-[state=active]:text-fg data-[state=active]:after:bg-accent"
                >
                  {t.label}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
          </Page>
        </div>
        <Page className="overflow-x-clip pt-5">
          <Tabs.Content value={tab} className="outline-none" tabIndex={-1}>
            <motion.div
              key={tab}
              initial={{ x: 32 * direction, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            >
              <Suspense fallback={<p className="label-caps py-10 text-center">Loading…</p>}>
                {tab === 'overview' && <OverviewTab bike={bike} health={health} />}
                {tab === 'service' && <ServiceTab bike={bike} />}
                {tab === 'fuel' && <FuelTab bike={bike} />}
                {tab === 'rides' && <RidesTab bike={bike} />}
                {tab === 'docs' && <DocsTab bike={bike} />}
                {tab === 'costs' && <CostsTab bike={bike} />}
              </Suspense>
            </motion.div>
          </Tabs.Content>
        </Page>
      </Tabs.Root>
    </div>
  );
}
