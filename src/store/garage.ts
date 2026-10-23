import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { buildSeed } from '@/data/seed';
import { todayISO } from '@/lib/dates';
import { docAsItemStatus, docStatus, itemStatus, STATUS_RANK } from '@/lib/due';
import { uid } from '@/lib/id';
import { reconcileBike } from '@/lib/reconcile';
import { getTemplate, scheduleFromTemplate } from '@/lib/templates';
import {
  emptyGarage,
  type Bike,
  type BikeDoc,
  type FuelEntry,
  type GarageData,
  type OdoReading,
  type Ride,
  type ScheduleItem,
  type ServiceEntry,
  type Settings,
} from '@/lib/types';
import { useUI } from './ui';

export const STORAGE_KEY = 'kickstand.v1';

export type EntryKind = 'fuel' | 'ride' | 'service' | 'doc' | 'reading' | 'item' | 'bike';

const COLLECTION: Record<Exclude<EntryKind, 'bike'>, keyof GarageData> = {
  fuel: 'fuel',
  ride: 'rides',
  service: 'services',
  doc: 'docs',
  reading: 'readings',
  item: 'schedule',
};

/** Records removed by a delete, so the undo toast can put them back. */
export type Removed = Partial<GarageData>;

type New<T> = Omit<T, 'id'>;

export interface NewBikeInput extends Omit<Bike, 'id'> {
  templateId: string;
  /** Where the schedule starts from — usually the last full service. */
  lastServiceKm: number;
  lastServiceDate: string;
}

interface Actions {
  addBike(input: NewBikeInput): string;
  updateBike(id: string, patch: Partial<Omit<Bike, 'id' | 'odometer'>>): void;

  addFuel(entry: New<FuelEntry>): FuelEntry;
  addRide(entry: New<Ride>): Ride;
  addService(entry: New<ServiceEntry>): ServiceEntry;
  addDoc(entry: New<BikeDoc>): BikeDoc;
  addReading(entry: New<OdoReading>): OdoReading;
  addItem(entry: Omit<ScheduleItem, 'id' | 'lastDoneKm' | 'lastDoneDate'>): ScheduleItem;
  /** Records a zero-cost DIY service for one item at the current odometer, today. */
  markDone(itemId: string): ServiceEntry | undefined;

  updateFuel(id: string, patch: Partial<FuelEntry>): void;
  updateRide(id: string, patch: Partial<Ride>): void;
  updateService(id: string, patch: Partial<ServiceEntry>): void;
  updateDoc(id: string, patch: Partial<BikeDoc>): void;
  updateReading(id: string, patch: Partial<OdoReading>): void;
  updateItem(id: string, patch: Partial<ScheduleItem>): void;

  remove(kind: EntryKind, id: string): Removed;
  restore(removed: Removed): void;

  setSettings(patch: Partial<Settings>): void;
  resetDemo(): void;
  clearAll(): void;
}

export type GarageState = GarageData & { settings: Settings } & Actions;

const DEFAULT_SETTINGS: Settings = {
  economyUnit: 'kmpl',
  theme: 'dark',
  bannerDismissed: false,
};

/** Seed only when nothing is stored yet; otherwise persist hydrates synchronously over this. */
function initialData(): GarageData {
  try {
    if (typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY))
      return emptyGarage();
  } catch {
    // Storage blocked (private mode): fall through to the demo.
  }
  return buildSeed();
}

const pick = (s: GarageState): GarageData => ({
  bikes: s.bikes,
  schedule: s.schedule,
  services: s.services,
  fuel: s.fuel,
  rides: s.rides,
  docs: s.docs,
  readings: s.readings,
});

/** Urgency of every enabled item and doc on the given bikes: 0 = overdue/expired, 1 = due soon, 2 = OK. */
function urgency(data: GarageData, bikeIds: Set<string>): Map<string, number> {
  const today = todayISO();
  const out = new Map<string, number>();
  for (const item of data.schedule) {
    if (!item.enabled || !bikeIds.has(item.bikeId)) continue;
    const bike = data.bikes.find((b) => b.id === item.bikeId);
    if (bike) out.set(item.id, STATUS_RANK[itemStatus(item, bike.odometer, today).status]);
  }
  for (const doc of data.docs) {
    if (bikeIds.has(doc.bikeId))
      out.set(doc.id, STATUS_RANK[docAsItemStatus(docStatus(doc, today).status)]);
  }
  return out;
}

export const useGarage = create<GarageState>()(
  persist(
    (set, get) => {
      /**
       * Apply a change, re-derive odometers and last-done for the touched bikes, and pulse anything
       * that has newly become due.
       */
      const commit = (bikeIds: Iterable<string>, change: (d: GarageData) => GarageData) => {
        const ids = new Set(bikeIds);
        const before = pick(get());
        let next = change(before);
        for (const id of ids) next = reconcileBike(next, id);
        // Anything that just became more urgent (OK → due soon, due soon → overdue) pulses once.
        const was = urgency(before, ids);
        const fresh = [...urgency(next, ids)]
          .filter(([id, rank]) => rank < (was.get(id) ?? 2))
          .map(([id]) => id);
        set(next);
        if (fresh.length) {
          const bikesWithFresh = new Set(
            [...next.schedule, ...next.docs]
              .filter((x) => fresh.includes(x.id))
              .map((x) => x.bikeId),
          );
          useUI.getState().pulse([...fresh, ...bikesWithFresh]);
        }
      };

      const addTo = <K extends keyof GarageData>(
        key: K,
        record: GarageData[K][number] & { bikeId: string },
      ) => commit([record.bikeId], (d) => ({ ...d, [key]: [...d[key], record] }));

      const updateIn = <K extends Exclude<keyof GarageData, 'bikes'>>(
        key: K,
        id: string,
        patch: Partial<GarageData[K][number]>,
      ) => {
        const list = get()[key] as Array<{ id: string; bikeId: string }>;
        const existing = list.find((x) => x.id === id);
        if (!existing) return;
        const bikeIds = new Set([existing.bikeId]);
        if ('bikeId' in patch && typeof patch.bikeId === 'string') bikeIds.add(patch.bikeId);
        commit(bikeIds, (d) => ({
          ...d,
          [key]: (d[key] as Array<{ id: string }>).map((x) =>
            x.id === id ? { ...x, ...patch } : x,
          ),
        }));
      };

      return {
        ...initialData(),
        settings: DEFAULT_SETTINGS,

        addBike(input) {
          const id = uid();
          const { templateId, lastServiceKm, lastServiceDate, ...bikeFields } = input;
          const bike: Bike = { ...bikeFields, id };
          const template = getTemplate(templateId);
          const schedule = template
            ? scheduleFromTemplate(template, id, lastServiceKm, lastServiceDate)
            : [];
          const reading: OdoReading = {
            id: uid(),
            bikeId: id,
            date: todayISO(),
            odometer: bike.odometer,
          };
          commit([id], (d) => ({
            ...d,
            bikes: [...d.bikes, bike],
            schedule: [...d.schedule, ...schedule],
            readings: [...d.readings, reading],
          }));
          return id;
        },

        updateBike(id, patch) {
          commit([id], (d) => ({
            ...d,
            bikes: d.bikes.map((b) => (b.id === id ? { ...b, ...patch } : b)),
          }));
        },

        addFuel(entry) {
          const record = { ...entry, id: uid() };
          addTo('fuel', record);
          return record;
        },
        addRide(entry) {
          const record = { ...entry, id: uid() };
          addTo('rides', record);
          return record;
        },
        addService(entry) {
          const record = { ...entry, id: uid() };
          addTo('services', record);
          return record;
        },
        addDoc(entry) {
          const record = { ...entry, id: uid() };
          addTo('docs', record);
          return record;
        },
        addReading(entry) {
          const record = { ...entry, id: uid() };
          addTo('readings', record);
          return record;
        },
        addItem(entry) {
          const record: ScheduleItem = {
            ...entry,
            id: uid(),
            lastDoneKm: entry.baselineKm,
            lastDoneDate: entry.baselineDate,
          };
          addTo('schedule', record);
          return record;
        },

        markDone(itemId) {
          const item = get().schedule.find((i) => i.id === itemId);
          const bike = item && get().bikes.find((b) => b.id === item.bikeId);
          if (!item || !bike) return undefined;
          return get().addService({
            bikeId: bike.id,
            date: todayISO(),
            odometer: bike.odometer,
            itemIds: [item.id],
            where: 'DIY',
            partsCost: 0,
            labourCost: 0,
            notes: `${item.name} — marked done`,
          });
        },

        updateFuel: (id, patch) => updateIn('fuel', id, patch),
        updateRide: (id, patch) => updateIn('rides', id, patch),
        updateService: (id, patch) => updateIn('services', id, patch),
        updateDoc: (id, patch) => updateIn('docs', id, patch),
        updateReading: (id, patch) => updateIn('readings', id, patch),
        updateItem(id, patch) {
          // Editing "last done" moves the baseline; services after it still win in reconcile.
          const p: Partial<ScheduleItem> = { ...patch };
          if (patch.lastDoneKm !== undefined) p.baselineKm = patch.lastDoneKm;
          if (patch.lastDoneDate !== undefined) p.baselineDate = patch.lastDoneDate;
          updateIn('schedule', id, p);
        },

        remove(kind, id) {
          const data = pick(get());
          if (kind === 'bike') {
            const removed: Removed = {
              bikes: data.bikes.filter((b) => b.id === id),
              schedule: data.schedule.filter((x) => x.bikeId === id),
              services: data.services.filter((x) => x.bikeId === id),
              fuel: data.fuel.filter((x) => x.bikeId === id),
              rides: data.rides.filter((x) => x.bikeId === id),
              docs: data.docs.filter((x) => x.bikeId === id),
              readings: data.readings.filter((x) => x.bikeId === id),
            };
            set({
              bikes: data.bikes.filter((b) => b.id !== id),
              schedule: data.schedule.filter((x) => x.bikeId !== id),
              services: data.services.filter((x) => x.bikeId !== id),
              fuel: data.fuel.filter((x) => x.bikeId !== id),
              rides: data.rides.filter((x) => x.bikeId !== id),
              docs: data.docs.filter((x) => x.bikeId !== id),
              readings: data.readings.filter((x) => x.bikeId !== id),
            });
            return removed;
          }

          const key = COLLECTION[kind];
          const list = data[key] as Array<{ id: string; bikeId: string }>;
          const record = list.find((x) => x.id === id);
          if (!record) return {};
          const removed: Removed = { [key]: [record] };
          commit([record.bikeId], (d) => {
            const next: GarageData = {
              ...d,
              [key]: (d[key] as Array<{ id: string }>).filter((x) => x.id !== id),
            };
            if (kind === 'item') {
              // Services keep their history but no longer point at the deleted item.
              const touched = d.services.filter((s) => s.itemIds.includes(id));
              if (touched.length) {
                removed.services = touched;
                next.services = d.services.map((s) =>
                  s.itemIds.includes(id) ? { ...s, itemIds: s.itemIds.filter((x) => x !== id) } : s,
                );
              }
            }
            return next;
          });
          return removed;
        },

        restore(removed) {
          const bikeIds = new Set<string>();
          for (const list of Object.values(removed)) {
            for (const r of list ?? []) bikeIds.add('bikeId' in r ? r.bikeId : r.id);
          }
          commit(bikeIds, (d) => {
            const next = { ...d };
            for (const key of Object.keys(removed) as Array<keyof GarageData>) {
              const back = (removed[key] ?? []) as Array<{ id: string }>;
              const ids = new Set(back.map((r) => r.id));
              // Replace any modified copies (e.g. services whose itemIds were trimmed), then append.
              (next[key] as Array<{ id: string }>) = [
                ...(d[key] as Array<{ id: string }>).filter((x) => !ids.has(x.id)),
                ...back,
              ];
            }
            return next;
          });
        },

        setSettings(patch) {
          set((s) => ({ settings: { ...s.settings, ...patch } }));
        },

        resetDemo() {
          set({ ...buildSeed(), settings: { ...get().settings, bannerDismissed: false } });
        },

        clearAll() {
          set({ ...emptyGarage(), settings: { ...get().settings, bannerDismissed: true } });
        },
      };
    },
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ ...pick(s), settings: s.settings }),
    },
  ),
);

/** Snapshot of the persisted data, for export. */
export const exportGarage = (): GarageData & { settings: Settings; exportedAt: string } => {
  const s = useGarage.getState();
  return { ...pick(s), settings: s.settings, exportedAt: new Date().toISOString() };
};
