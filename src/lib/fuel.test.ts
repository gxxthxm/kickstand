import { describe, expect, it } from 'vitest';
import { convertEconomy, economyReadings, formatEconomy, fuelStats, pricePerLitre } from './fuel';
import type { FuelEntry } from './types';

let n = 0;
const fill = (
  odometer: number,
  litres: number,
  fullTank = true,
  amount = litres * 100,
): FuelEntry => ({
  id: `f${++n}`,
  bikeId: 'b',
  date: `2026-01-${String(Math.min(28, Math.floor(odometer / 100) + 1)).padStart(2, '0')}`,
  odometer,
  litres,
  amount,
  fullTank,
});

describe('economyReadings (full-to-full)', () => {
  it('needs two full tanks for a reading', () => {
    expect(economyReadings([])).toEqual([]);
    expect(economyReadings([fill(1000, 10)])).toEqual([]);
  });

  it('divides km since the previous full by litres added since', () => {
    const r = economyReadings([fill(1000, 10), fill(1300, 10)]);
    expect(r).toHaveLength(1);
    expect(r[0].distance).toBe(300);
    expect(r[0].litres).toBe(10);
    expect(r[0].kmpl).toBe(30);
  });

  it('adds partial fills to the next full reading without producing their own', () => {
    const entries = [fill(1000, 12), fill(1150, 3, false), fill(1400, 7)];
    const r = economyReadings(entries);
    expect(r).toHaveLength(1);
    expect(r[0].entryId).toBe(entries[2].id);
    expect(r[0].litres).toBe(10);
    expect(r[0].kmpl).toBe(40);
  });

  it('ignores partial fills before the first full tank', () => {
    const r = economyReadings([fill(900, 4, false), fill(1000, 12), fill(1300, 10)]);
    expect(r).toHaveLength(1);
    expect(r[0].kmpl).toBe(30);
  });

  it('sorts by odometer regardless of input order', () => {
    const a = fill(1000, 10);
    const b = fill(1250, 10);
    const c = fill(1550, 10);
    const r = economyReadings([c, a, b]);
    expect(r.map((x) => x.kmpl)).toEqual([25, 30]);
  });

  it('ends a reading on each full tank, resetting the litre count', () => {
    const r = economyReadings([fill(0, 10), fill(300, 10), fill(400, 2, false), fill(700, 8)]);
    expect(r.map((x) => [x.distance, x.litres])).toEqual([
      [300, 10],
      [400, 10],
    ]);
  });
});

describe('fuelStats', () => {
  it('computes a distance-weighted average, best and latest', () => {
    const s = fuelStats([fill(0, 10), fill(300, 10), fill(800, 10), fill(1000, 10)]);
    // readings: 30, 50, 20 → total 1000 km / 30 l
    expect(s.average).toBeCloseTo(1000 / 30);
    expect(s.best?.kmpl).toBe(50);
    expect(s.latest?.kmpl).toBe(20);
  });

  it('alerts when the latest reading is 15%+ below average', () => {
    const base = [fill(0, 10), fill(300, 10), fill(600, 10), fill(900, 10), fill(1200, 10)];
    expect(fuelStats(base).alert).toBe(false);
    const dropped = fuelStats([...base, fill(1440, 10)]); // 24 vs avg ~ 28.8 → 16.7% drop
    expect(dropped.latestDrop).toBeGreaterThan(0.15);
    expect(dropped.alert).toBe(true);
  });

  it('does not alert on a single reading', () => {
    expect(fuelStats([fill(0, 10), fill(100, 10)]).alert).toBe(false);
  });

  it('derives price per litre', () => {
    expect(pricePerLitre({ amount: 1029.2, litres: 10 })).toBeCloseTo(102.92);
    expect(pricePerLitre({ amount: 100, litres: 0 })).toBe(0);
    const s = fuelStats([fill(0, 10, true, 1000), fill(300, 10, true, 1100)]);
    expect(s.avgPricePerLitre).toBeCloseTo(105);
  });
});

describe('units', () => {
  it('converts km/l to l/100km', () => {
    expect(convertEconomy(25, 'l100km')).toBe(4);
    expect(convertEconomy(25, 'kmpl')).toBe(25);
    expect(formatEconomy(42.34, 'kmpl')).toBe('42.3 km/l');
    expect(formatEconomy(40, 'l100km')).toBe('2.5 l/100km');
  });
});
