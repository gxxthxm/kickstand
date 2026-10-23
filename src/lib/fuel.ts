import type { EconomyUnit, FuelEntry, ISODate } from './types';

export const MILEAGE_ALERT_DROP = 0.15;

export interface EconomyReading {
  entryId: string;
  date: ISODate;
  odometer: number;
  /** Km since the previous full tank. */
  distance: number;
  /** Litres of every fill after the previous full tank, up to and including this one. */
  litres: number;
  kmpl: number;
}

/** Oldest first: by odometer, then date. */
export const sortFuel = (entries: FuelEntry[]): FuelEntry[] =>
  [...entries].sort(
    (a, b) => a.odometer - b.odometer || (a.date < b.date ? -1 : a.date > b.date ? 1 : 0),
  );

/**
 * Full-to-full method. For each full-tank entry after the first, economy = km since the
 * previous full-tank entry ÷ total litres of all fills after that previous full tank, up to and
 * including this one. Partial fills add litres but don't produce a reading. Fills before the
 * first full tank are ignored, because we don't know how full the tank was.
 */
export function economyReadings(entries: FuelEntry[]): EconomyReading[] {
  const readings: EconomyReading[] = [];
  let lastFull: FuelEntry | undefined;
  let litresSince = 0;
  for (const e of sortFuel(entries)) {
    if (!lastFull) {
      if (e.fullTank) lastFull = e;
      continue;
    }
    litresSince += e.litres;
    if (!e.fullTank) continue;
    const distance = e.odometer - lastFull.odometer;
    if (distance > 0 && litresSince > 0) {
      readings.push({
        entryId: e.id,
        date: e.date,
        odometer: e.odometer,
        distance,
        litres: litresSince,
        kmpl: distance / litresSince,
      });
    }
    lastFull = e;
    litresSince = 0;
  }
  return readings;
}

export const pricePerLitre = (e: Pick<FuelEntry, 'amount' | 'litres'>): number =>
  e.litres > 0 ? e.amount / e.litres : 0;

export interface FuelStats {
  readings: EconomyReading[];
  /** Distance-weighted: total km ÷ total litres across all readings. */
  average?: number;
  best?: EconomyReading;
  latest?: EconomyReading;
  /** How far the latest reading sits below the average, as a fraction (0.2 = 20% lower). */
  latestDrop?: number;
  alert: boolean;
  fullCount: number;
  totalLitres: number;
  totalAmount: number;
  avgPricePerLitre?: number;
}

export function fuelStats(entries: FuelEntry[]): FuelStats {
  const readings = economyReadings(entries);
  const totalLitres = entries.reduce((s, e) => s + e.litres, 0);
  const totalAmount = entries.reduce((s, e) => s + e.amount, 0);
  const fullCount = entries.filter((e) => e.fullTank).length;
  const stats: FuelStats = {
    readings,
    alert: false,
    fullCount,
    totalLitres,
    totalAmount,
    avgPricePerLitre: totalLitres > 0 ? totalAmount / totalLitres : undefined,
  };
  if (readings.length === 0) return stats;

  const km = readings.reduce((s, r) => s + r.distance, 0);
  const litres = readings.reduce((s, r) => s + r.litres, 0);
  stats.average = km / litres;
  stats.best = readings.reduce((b, r) => (r.kmpl > b.kmpl ? r : b));
  stats.latest = readings[readings.length - 1];
  stats.latestDrop = 1 - stats.latest.kmpl / stats.average;
  stats.alert = readings.length >= 2 && stats.latestDrop >= MILEAGE_ALERT_DROP;
  return stats;
}

/** Reading produced by a specific entry, if any. */
export const readingFor = (entries: FuelEntry[], entryId: string): EconomyReading | undefined =>
  economyReadings(entries).find((r) => r.entryId === entryId);

// ---------------------------------------------------------------------------
// Units

export const convertEconomy = (kmpl: number, unit: EconomyUnit): number =>
  unit === 'kmpl' ? kmpl : kmpl > 0 ? 100 / kmpl : 0;

export const economyUnitLabel = (unit: EconomyUnit): string =>
  unit === 'kmpl' ? 'km/l' : 'l/100km';

export const formatEconomy = (kmpl: number, unit: EconomyUnit): string =>
  `${convertEconomy(kmpl, unit).toFixed(1)} ${economyUnitLabel(unit)}`;
