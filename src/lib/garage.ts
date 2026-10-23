/** Derived views over the whole garage, shared by several screens. */
import {
  bikeHealth,
  compareDue,
  docAsItemStatus,
  docMessage,
  docStatus,
  dueMessage,
  itemStatus,
  STATUS_RANK,
  type DocInfo,
  type DueInfo,
  type Health,
} from './due';
import type { Bike, BikeDoc, GarageData, ISODate, ItemStatus, ScheduleItem } from './types';

export interface ItemView {
  item: ScheduleItem;
  info: DueInfo;
  message: string;
}

export interface DocView {
  doc: BikeDoc;
  info: DocInfo;
  message: string;
}

export function bikeItems(data: GarageData, bike: Bike, today: ISODate): ItemView[] {
  return data.schedule
    .filter((i) => i.bikeId === bike.id)
    .map((item) => {
      const info = itemStatus(item, bike.odometer, today);
      return { item, info, message: dueMessage(item.name, info) };
    })
    .sort((a, b) => Number(b.item.enabled) - Number(a.item.enabled) || compareDue(a.info, b.info));
}

export function bikeDocs(data: GarageData, bikeId: string, today: ISODate): DocView[] {
  return data.docs
    .filter((d) => d.bikeId === bikeId)
    .map((doc) => {
      const info = docStatus(doc, today);
      return { doc, info, message: docMessage(doc, info) };
    })
    .sort((a, b) => a.info.daysLeft - b.info.daysLeft);
}

export function healthOf(data: GarageData, bike: Bike, today: ISODate): Health {
  return bikeHealth(
    data.schedule.filter((i) => i.bikeId === bike.id),
    bike.odometer,
    today,
  );
}

export interface AttentionRow {
  key: string;
  kind: 'item' | 'doc';
  id: string;
  bike: Bike;
  status: ItemStatus;
  /** Label for the status chip ("Expiring" reads better than "Due soon" for papers). */
  statusLabel: string;
  message: string;
  /** Lower = more urgent within a status. */
  urgency: number;
}

/**
 * The combined "Needs attention" list across bikes: overdue first, then due soon, including
 * expired and expiring documents. Pass includeOk to append the OK items too.
 */
export function attentionList(data: GarageData, today: ISODate, includeOk = false): AttentionRow[] {
  const rows: AttentionRow[] = [];
  for (const bike of data.bikes) {
    for (const { item, info, message } of bikeItems(data, bike, today)) {
      if (!item.enabled || (info.status === 'OK' && !includeOk)) continue;
      rows.push({
        key: `item-${item.id}`,
        kind: 'item',
        id: item.id,
        bike,
        status: info.status,
        statusLabel: statusLabel(info.status),
        message,
        urgency: info.remaining,
      });
    }
    for (const { doc, info, message } of bikeDocs(data, bike.id, today)) {
      const status = docAsItemStatus(info.status);
      if (status === 'OK' && !includeOk) continue;
      rows.push({
        key: `doc-${doc.id}`,
        kind: 'doc',
        id: doc.id,
        bike,
        status,
        statusLabel: info.status === 'Valid' ? 'Valid' : info.status,
        message,
        // Put papers on the same 0–1 "share left" scale, assuming a 1-year validity.
        urgency: info.daysLeft / 365,
      });
    }
  }
  return rows.sort(
    (a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status] || a.urgency - b.urgency,
  );
}

export const statusLabel = (s: ItemStatus): string =>
  s === 'Overdue' ? 'Overdue' : s === 'DueSoon' ? 'Due soon' : 'OK';

export type ActivityKind = 'fuel' | 'ride' | 'service' | 'reading';

export interface Activity {
  kind: ActivityKind;
  id: string;
  bikeId: string;
  date: ISODate;
  odometer: number;
  /** Money spent on this log (fuel amount, parts + labour). */
  cost: number;
}

export interface ActivityFilter {
  bikeId?: string;
  kinds?: ActivityKind[];
}

/** Every log across the garage (or one bike), newest first. */
export function activity(data: GarageData, filter: ActivityFilter = {}): Activity[] {
  const out: Activity[] = [];
  const want = (kind: ActivityKind, bikeId: string) =>
    (!filter.bikeId || bikeId === filter.bikeId) && (!filter.kinds || filter.kinds.includes(kind));
  for (const f of data.fuel) {
    if (want('fuel', f.bikeId))
      out.push({
        kind: 'fuel',
        id: f.id,
        bikeId: f.bikeId,
        date: f.date,
        odometer: f.odometer,
        cost: f.amount,
      });
  }
  for (const r of data.rides) {
    if (want('ride', r.bikeId))
      out.push({
        kind: 'ride',
        id: r.id,
        bikeId: r.bikeId,
        date: r.date,
        odometer: r.endKm,
        cost: 0,
      });
  }
  for (const s of data.services) {
    if (want('service', s.bikeId))
      out.push({
        kind: 'service',
        id: s.id,
        bikeId: s.bikeId,
        date: s.date,
        odometer: s.odometer,
        cost: s.partsCost + s.labourCost,
      });
  }
  for (const o of data.readings) {
    if (want('reading', o.bikeId))
      out.push({
        kind: 'reading',
        id: o.id,
        bikeId: o.bikeId,
        date: o.date,
        odometer: o.odometer,
        cost: 0,
      });
  }
  return out.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.odometer - a.odometer));
}

/** Every log for one bike, newest first. */
export const activityFor = (data: GarageData, bikeId: string): Activity[] =>
  activity(data, { bikeId });

export interface ActivityMonth {
  /** yyyy-MM */
  month: string;
  items: Activity[];
  cost: number;
}

/** Group a newest-first list into calendar months, keeping order. */
export function groupByMonth(items: Activity[]): ActivityMonth[] {
  const groups: ActivityMonth[] = [];
  for (const a of items) {
    const month = a.date.slice(0, 7);
    let g = groups[groups.length - 1];
    if (!g || g.month !== month) {
      g = { month, items: [], cost: 0 };
      groups.push(g);
    }
    g.items.push(a);
    g.cost += a.cost;
  }
  return groups;
}

/** Scooters carry a CVT belt instead of a chain; that's the tell in a schedule. */
export const isScooterSchedule = (names: string[]): boolean =>
  names.some((n) => n.toLowerCase().includes('cvt'));
