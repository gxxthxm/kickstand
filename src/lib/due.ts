import { addMonthsISO, daysBetween, humanizeDays, parseDate } from './dates';
import type { BikeDoc, DocStatus, ISODate, ItemStatus, ScheduleItem } from './types';

export const DUE_SOON_KM_FRACTION = 0.1;
export const DUE_SOON_DAYS = 14;
export const DOC_EXPIRING_DAYS = 30;

export interface DueInfo {
  status: ItemStatus;
  /** Km until due; negative when overdue. Undefined for time-only items. */
  kmLeft?: number;
  /** Days until due; negative when overdue. Undefined for km-only items. */
  daysLeft?: number;
  dueKm?: number;
  dueDate?: ISODate;
  /** Share of the interval used, 0–1 (capped). */
  progress: number;
  /**
   * Smallest share of the interval left across both limits; negative when overdue.
   * Lower is more urgent — used for sorting.
   */
  remaining: number;
  /** Which limit is closest to (or furthest past) due. */
  by: 'km' | 'time';
}

/**
 * Service-due rule.
 *   kmLeft   = lastDoneKm + intervalKm − odometer
 *   daysLeft = (lastDoneDate + intervalMonths) − today
 * Overdue if either is below 0. Due soon if kmLeft ≤ 10% of intervalKm or daysLeft ≤ 14.
 * Progress is the larger of km used / intervalKm and days used / interval days, capped at 1.
 */
export function itemStatus(
  item: Pick<ScheduleItem, 'intervalKm' | 'intervalMonths' | 'lastDoneKm' | 'lastDoneDate'>,
  odometer: number,
  today: ISODate | Date,
): DueInfo {
  const hasKm = item.intervalKm !== undefined && item.intervalKm > 0;
  const hasTime = item.intervalMonths !== undefined && item.intervalMonths > 0;

  let kmLeft: number | undefined;
  let dueKm: number | undefined;
  let kmProgress = 0;
  let kmRemaining = Infinity;
  if (hasKm) {
    const interval = item.intervalKm as number;
    dueKm = item.lastDoneKm + interval;
    kmLeft = dueKm - odometer;
    kmProgress = (odometer - item.lastDoneKm) / interval;
    kmRemaining = kmLeft / interval;
  }

  let daysLeft: number | undefined;
  let dueDate: ISODate | undefined;
  let timeProgress = 0;
  let timeRemaining = Infinity;
  if (hasTime) {
    dueDate = addMonthsISO(item.lastDoneDate, item.intervalMonths as number);
    const intervalDays = Math.max(1, daysBetween(item.lastDoneDate, dueDate));
    daysLeft = daysBetween(parseDate(today), dueDate);
    timeProgress = daysBetween(item.lastDoneDate, parseDate(today)) / intervalDays;
    timeRemaining = daysLeft / intervalDays;
  }

  let status: ItemStatus = 'OK';
  if ((kmLeft !== undefined && kmLeft < 0) || (daysLeft !== undefined && daysLeft < 0)) {
    status = 'Overdue';
  } else if (
    (kmLeft !== undefined && kmLeft <= DUE_SOON_KM_FRACTION * (item.intervalKm as number)) ||
    (daysLeft !== undefined && daysLeft <= DUE_SOON_DAYS)
  ) {
    status = 'DueSoon';
  }

  const progress = clamp01(Math.max(kmProgress, timeProgress));
  const remaining = hasKm || hasTime ? Math.min(kmRemaining, timeRemaining) : 1;

  // Decide which limit "drives" the item, for microcopy.
  let by: 'km' | 'time' = hasKm ? 'km' : 'time';
  if (hasKm && hasTime) {
    const kmTrips = (kmLeft as number) <= DUE_SOON_KM_FRACTION * (item.intervalKm as number);
    const timeTrips = (daysLeft as number) <= DUE_SOON_DAYS;
    if (status === 'Overdue') by = (kmLeft as number) < 0 ? 'km' : 'time';
    else if (status === 'DueSoon') by = kmTrips ? 'km' : timeTrips ? 'time' : 'km';
    else by = kmRemaining <= timeRemaining ? 'km' : 'time';
  }

  return { status, kmLeft, daysLeft, dueKm, dueDate, progress, remaining, by };
}

export const STATUS_RANK: Record<ItemStatus, number> = { Overdue: 0, DueSoon: 1, OK: 2 };

/** Sort comparator: Overdue → Due soon → OK, then most urgent first. */
export function compareDue(a: DueInfo, b: DueInfo): number {
  return STATUS_RANK[a.status] - STATUS_RANK[b.status] || a.remaining - b.remaining;
}

export interface Health {
  ok: number;
  total: number;
  /** Share of enabled items that are OK (1 when there are none). */
  ratio: number;
  overdue: number;
  dueSoon: number;
}

/** Bike health = share of enabled items that are OK. */
export function bikeHealth(items: ScheduleItem[], odometer: number, today: ISODate | Date): Health {
  const enabled = items.filter((i) => i.enabled);
  let ok = 0;
  let overdue = 0;
  let dueSoon = 0;
  for (const item of enabled) {
    const s = itemStatus(item, odometer, today).status;
    if (s === 'OK') ok++;
    else if (s === 'Overdue') overdue++;
    else dueSoon++;
  }
  const total = enabled.length;
  return { ok, total, ratio: total === 0 ? 1 : ok / total, overdue, dueSoon };
}

// ---------------------------------------------------------------------------
// Microcopy

const OVERDUE_SUBJECT: Record<string, string> = {
  'chain clean & lube': "Chain's thirsty",
  'chain adjust': "Chain's slack",
  'engine oil': "Oil's tired",
  'brake pads inspect': 'Brake pads need a look',
  'tyres inspect': 'Tyres need a look',
  'air filter': "Air filter's choking",
};

const ACTION_NOUN: Record<string, string> = {
  'engine oil': 'Oil change',
  'chain clean & lube': 'Chain lube',
  'chain adjust': 'Chain adjust',
  'brake pads inspect': 'Brake check',
  'tyres inspect': 'Tyre check',
  coolant: 'Coolant change',
};

const fmtKm = (n: number) => `${Math.round(Math.abs(n)).toLocaleString('en-IN')} km`;

/**
 * "Chain's thirsty — 120 km past due", "Oil change in 380 km or 3 weeks", "Coolant change in 7 months".
 */
export function dueMessage(name: string, info: DueInfo): string {
  const key = name.trim().toLowerCase();
  if (info.status === 'Overdue') {
    const subject = OVERDUE_SUBJECT[key] ?? `${name} overdue`;
    const past =
      info.by === 'km' && info.kmLeft !== undefined
        ? fmtKm(info.kmLeft)
        : humanizeDays(info.daysLeft ?? 0);
    return `${subject} — ${past} past due`;
  }
  const noun = ACTION_NOUN[key] ?? name;
  const parts: string[] = [];
  if (info.kmLeft !== undefined) parts.push(info.kmLeft === 0 ? 'now' : `in ${fmtKm(info.kmLeft)}`);
  if (info.daysLeft !== undefined) {
    parts.push(info.daysLeft === 0 ? 'today' : `in ${humanizeDays(info.daysLeft)}`);
  }
  if (parts.length === 0) return `${noun} — no interval set`;
  if (parts.length === 2) {
    // "in 380 km or 3 weeks" — drop the repeated "in". Km leads, unless time is what made it due.
    const [km, time] = parts;
    const timeFirst = info.status === 'DueSoon' && info.by === 'time';
    const first = timeFirst ? time : km;
    const second = (timeFirst ? km : time).replace(/^in /, '');
    return `${noun} ${first} or ${second}`;
  }
  return `${noun} ${parts[0]}`;
}

// ---------------------------------------------------------------------------
// Documents

export interface DocInfo {
  status: DocStatus;
  daysLeft: number;
}

export function docStatus(doc: Pick<BikeDoc, 'expiresAt'>, today: ISODate | Date): DocInfo {
  const daysLeft = daysBetween(parseDate(today), doc.expiresAt);
  const status: DocStatus =
    daysLeft < 0 ? 'Expired' : daysLeft <= DOC_EXPIRING_DAYS ? 'Expiring' : 'Valid';
  return { status, daysLeft };
}

/** "PUC expires in 9 days", "Insurance expired 3 weeks ago", "Licence expires today". */
export function docMessage(doc: Pick<BikeDoc, 'type'>, info: DocInfo): string {
  if (info.daysLeft === 0) return `${doc.type} expires today`;
  if (info.daysLeft < 0) return `${doc.type} expired ${humanizeDays(-info.daysLeft)} ago`;
  return `${doc.type} expires in ${humanizeDays(info.daysLeft)}`;
}

/** Map a document status onto the item urgency scale so both can share one list. */
export const docAsItemStatus = (s: DocStatus): ItemStatus =>
  s === 'Expired' ? 'Overdue' : s === 'Expiring' ? 'DueSoon' : 'OK';

const clamp01 = (n: number) => Math.min(1, Math.max(0, Number.isFinite(n) ? n : 0));
