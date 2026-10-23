import { format, parseISO } from 'date-fns';
import type { GarageData, ISODate } from './types';

export interface OdoPoint {
  /** Id of the log this point came from (a ride contributes two points with the same id). */
  id: string;
  date: ISODate;
  km: number;
}

/** Every odometer value a bike's logs have recorded. */
export function bikeOdoPoints(data: GarageData, bikeId: string): OdoPoint[] {
  const pts: OdoPoint[] = [];
  for (const r of data.readings)
    if (r.bikeId === bikeId) pts.push({ id: r.id, date: r.date, km: r.odometer });
  for (const f of data.fuel)
    if (f.bikeId === bikeId) pts.push({ id: f.id, date: f.date, km: f.odometer });
  for (const s of data.services)
    if (s.bikeId === bikeId) pts.push({ id: s.id, date: s.date, km: s.odometer });
  for (const r of data.rides) {
    if (r.bikeId !== bikeId) continue;
    pts.push({ id: r.id, date: r.date, km: r.startKm });
    pts.push({ id: r.id, date: r.date, km: r.endKm });
  }
  return pts;
}

export const maxOdometer = (points: OdoPoint[]): number | undefined =>
  points.length ? Math.max(...points.map((p) => p.km)) : undefined;

export interface OdoBounds {
  /** Highest reading on or before the date. */
  min: number;
  /** Lowest reading after the date; undefined when the date is the latest. */
  max?: number;
  maxDate?: ISODate;
}

export function odometerBounds(points: OdoPoint[], date: ISODate, excludeId?: string): OdoBounds {
  let min = 0;
  let max: number | undefined;
  let maxDate: ISODate | undefined;
  for (const p of points) {
    if (excludeId && p.id === excludeId) continue;
    if (p.date <= date) {
      if (p.km > min) min = p.km;
    } else if (max === undefined || p.km < max) {
      max = p.km;
      maxDate = p.date;
    }
  }
  return { min, max, maxDate };
}

/**
 * A new log's odometer can't be lower than the bike's current odometer. If it's back-dated, it must
 * sit between its neighbours. Returns an error message, or null when valid.
 */
export function validateOdometer(
  points: OdoPoint[],
  date: ISODate,
  km: number,
  excludeId?: string,
): string | null {
  if (!Number.isFinite(km) || km < 0) return 'Enter the odometer reading in km.';
  const { min, max, maxDate } = odometerBounds(points, date, excludeId);
  const fmt = (n: number) => `${n.toLocaleString('en-IN')} km`;
  if (max === undefined) {
    if (km < min) return `Can't be lower than the current odometer (${fmt(min)}).`;
    return null;
  }
  if (km < min) return `On this date the odometer was already at ${fmt(min)}.`;
  if (km > max)
    return `A later log (${format(parseISO(maxDate as string), 'd MMM yyyy')}) shows ${fmt(max)}. Enter between ${fmt(min)} and ${fmt(max)}.`;
  return null;
}
