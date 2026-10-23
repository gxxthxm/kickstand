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
  date: ISODate;
  odometer: number;
}

/** Every log for a bike, newest first. */
export function activityFor(data: GarageData, bikeId: string): Activity[] {
  const out: Activity[] = [];
  for (const f of data.fuel)
    if (f.bikeId === bikeId)
      out.push({ kind: 'fuel', id: f.id, date: f.date, odometer: f.odometer });
  for (const r of data.rides)
    if (r.bikeId === bikeId) out.push({ kind: 'ride', id: r.id, date: r.date, odometer: r.endKm });
  for (const s of data.services)
    if (s.bikeId === bikeId)
      out.push({ kind: 'service', id: s.id, date: s.date, odometer: s.odometer });
  for (const o of data.readings)
    if (o.bikeId === bikeId)
      out.push({ kind: 'reading', id: o.id, date: o.date, odometer: o.odometer });
  return out.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.odometer - a.odometer));
}
