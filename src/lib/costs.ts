import { format, startOfMonth, subMonths } from 'date-fns';
import { addMonthsISO, daysBetween, parseDate } from './dates';
import { bikeOdoPoints } from './odometer';
import type { BikeDoc, DocType, GarageData, ISODate } from './types';

export const COST_CATEGORIES = ['fuel', 'service', 'parts', 'documents'] as const;
export type CostCategory = (typeof COST_CATEGORIES)[number];

export const COST_LABELS: Record<CostCategory, string> = {
  fuel: 'Fuel',
  service: 'Service',
  parts: 'Parts',
  documents: 'Documents',
};

export interface CostBreakdown extends Record<CostCategory, number> {
  total: number;
  /** Km covered since the first log (the "since purchase" distance we know about). */
  kmTracked: number;
  costPerKm?: number;
}

/** How long each document type is usually valid, to date its cost when issuedAt is missing. */
const TYPICAL_VALIDITY_MONTHS: Record<DocType, number> = {
  Insurance: 12,
  PUC: 12,
  Registration: 180,
  Licence: 240,
};

export const docCostDate = (doc: BikeDoc): ISODate =>
  doc.issuedAt ?? addMonthsISO(doc.expiresAt, -TYPICAL_VALIDITY_MONTHS[doc.type]);

/**
 * Totals for one bike (or every bike when bikeId is omitted), split into fuel, service (labour),
 * parts and documents, with cost per km over the distance we have logs for.
 */
export function costBreakdown(data: GarageData, bikeId?: string): CostBreakdown {
  const mine = <T extends { bikeId: string }>(xs: T[]) =>
    bikeId ? xs.filter((x) => x.bikeId === bikeId) : xs;

  const fuel = sum(mine(data.fuel).map((f) => f.amount));
  const service = sum(mine(data.services).map((s) => s.labourCost));
  const parts = sum(mine(data.services).map((s) => s.partsCost));
  const documents = sum(mine(data.docs).map((d) => d.cost ?? 0));
  const total = fuel + service + parts + documents;

  const bikeIds = bikeId ? [bikeId] : data.bikes.map((b) => b.id);
  let kmTracked = 0;
  for (const id of bikeIds) {
    const kms = bikeOdoPoints(data, id).map((p) => p.km);
    if (kms.length) kmTracked += Math.max(...kms) - Math.min(...kms);
  }

  return {
    fuel,
    service,
    parts,
    documents,
    total,
    kmTracked,
    costPerKm: kmTracked > 0 ? total / kmTracked : undefined,
  };
}

export interface MonthCost extends Record<CostCategory, number> {
  /** yyyy-MM */
  month: string;
  /** "Nov" or "Jan '26" at a year boundary */
  label: string;
  total: number;
}

/** Monthly totals for the last `months` months, oldest first, ending with the current month. */
export function monthlyCosts(
  data: GarageData,
  today: ISODate | Date,
  months = 12,
  bikeId?: string,
): MonthCost[] {
  const end = startOfMonth(parseDate(today));
  const buckets = new Map<string, MonthCost>();
  for (let i = months - 1; i >= 0; i--) {
    const d = subMonths(end, i);
    const key = format(d, 'yyyy-MM');
    buckets.set(key, {
      month: key,
      label: d.getMonth() === 0 ? format(d, "MMM ''yy") : format(d, 'MMM'),
      fuel: 0,
      service: 0,
      parts: 0,
      documents: 0,
      total: 0,
    });
  }
  const add = (date: ISODate, cat: CostCategory, amount: number) => {
    const b = buckets.get(date.slice(0, 7));
    if (!b || !amount) return;
    b[cat] += amount;
    b.total += amount;
  };
  const mine = <T extends { bikeId: string }>(xs: T[]) =>
    bikeId ? xs.filter((x) => x.bikeId === bikeId) : xs;

  for (const f of mine(data.fuel)) add(f.date, 'fuel', f.amount);
  for (const s of mine(data.services)) {
    add(s.date, 'service', s.labourCost);
    add(s.date, 'parts', s.partsCost);
  }
  for (const d of mine(data.docs)) add(docCostDate(d), 'documents', d.cost ?? 0);
  return [...buckets.values()];
}

/** Days between the first and last dated cost or log, used for the "under a month of data" state. */
export function dataSpanDays(data: GarageData, bikeId?: string): number {
  const dates: ISODate[] = [];
  const mine = <T extends { bikeId: string }>(xs: T[]) =>
    bikeId ? xs.filter((x) => x.bikeId === bikeId) : xs;
  for (const x of mine(data.fuel)) dates.push(x.date);
  for (const x of mine(data.services)) dates.push(x.date);
  for (const x of mine(data.rides)) dates.push(x.date);
  if (dates.length < 2) return 0;
  dates.sort();
  return daysBetween(dates[0], dates[dates.length - 1]);
}

const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0);
