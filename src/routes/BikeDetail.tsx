import { lazy, Suspense, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Pencil } from 'lucide-react';
import { Tabs } from 'radix-ui';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { bikeItems, healthOf, isScooterSchedule } from '@/lib/garage';
import { useBike, useData, useToday } from '@/store/hooks';
import { BikeActions } from '@/components/BikeActions';
import { BikeAvatar } from '@/components/BikeAvatar';
import { HealthStrip } from '@/components/HealthStrip';
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
  const items = useMemo(() => (bike ? bikeItems(data, bike, today) : []), [data, bike, today]);
  if (!bike || !health) return <Navigate to="/" replace />;

  return (
    <div>
      <div className="border-b border-line">
        <Page className="pt-3 pb-5 md:pt-6">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-full pr-3 pl-1 text-sm font-medium text-muted hover:text-fg"
            >
              <ChevronLeft className="size-5" /> Garage
            </Link>
            <Button asChild variant="ghost" size="sm">
              <Link to={`/bikes/${bike.id}/edit`}>
                <Pencil /> Edit
              </Link>
            </Button>
          </div>

          <div className="mt-3 flex items-center gap-4">
            <BikeAvatar
              colour={bike.colour}
              size="lg"
              scooter={isScooterSchedule(items.map((v) => v.item.name))}
            />
            <div className="min-w-0">
              <h1 className="font-display text-3xl leading-tight font-semibold break-words md:text-4xl">
                {bike.nickname}
              </h1>
              <p className="text-sm text-muted">
                {bike.year} {bike.make} {bike.model}
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-end justify-between gap-4">
            <div>
              <p className="label-caps">Odometer</p>
              <Odometer value={bike.odometer} className="mt-1 text-4xl" />
            </div>
            <div className="text-right">
              <p className="label-caps">Health</p>
              <p className="num mt-1 text-2xl font-semibold tracking-tight">
                {health.ok}
                <span className="text-base text-faint">/{health.total} OK</span>
              </p>
            </div>
          </div>
          <HealthStrip items={items} className="mt-3" />
          <BikeActions bike={bike} className="mt-5" />
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
                  className="relative h-12 shrink-0 cursor-pointer px-3.5 text-sm font-semibold text-faint transition-colors after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full hover:text-fg data-[state=active]:text-fg data-[state=active]:after:bg-accent-line"
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
