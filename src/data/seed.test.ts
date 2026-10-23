import { describe, expect, it } from 'vitest';
import { bikeHealth, docStatus, itemStatus } from '@/lib/due';
import { fuelStats } from '@/lib/fuel';
import { bikeOdoPoints } from '@/lib/odometer';
import { buildSeed } from './seed';

// Run against a handful of "todays" so month lengths and weekdays can't break the states.
const TODAYS = [
  new Date(2026, 9, 22),
  new Date(2026, 1, 28),
  new Date(2027, 0, 1),
  new Date(2026, 6, 31),
  new Date(2028, 1, 29),
];

describe.each(TODAYS)('seed relative to %s', (now) => {
  const data = buildSeed(now);
  const bike = (nick: string) => {
    const b = data.bikes.find((x) => x.nickname === nick);
    if (!b) throw new Error(nick);
    return b;
  };

  it('has the three bikes at their odometers', () => {
    expect(data.bikes.map((b) => [b.nickname, b.odometer])).toEqual([
      ['Dusty', 8400],
      ['Orange Crush', 21700],
      ['Errand Runner', 14200],
    ]);
  });

  it('lands on 1 overdue (KTM chain adjust, ~120 km past) and 3 due soon', () => {
    const statuses = data.schedule
      .filter((i) => i.enabled)
      .map((i) => {
        const b = data.bikes.find((x) => x.id === i.bikeId);
        return { item: i, bike: b?.nickname, info: itemStatus(i, b?.odometer ?? 0, now) };
      });
    const overdue = statuses.filter((s) => s.info.status === 'Overdue');
    const soon = statuses.filter((s) => s.info.status === 'DueSoon');
    expect(overdue.map((s) => `${s.bike}: ${s.item.name}`)).toEqual(['Orange Crush: Chain adjust']);
    expect(overdue[0].info.kmLeft).toBe(-120);
    expect(soon.map((s) => `${s.bike}: ${s.item.name}`).sort()).toEqual([
      'Dusty: Chain clean & lube',
      'Errand Runner: Engine oil',
      'Orange Crush: Engine oil',
    ]);
  });

  it('has one disabled item (scooter coolant)', () => {
    const disabled = data.schedule.filter((i) => !i.enabled);
    expect(disabled.map((i) => i.name)).toEqual(['Coolant']);
    expect(
      bikeHealth(
        data.schedule.filter((i) => i.bikeId === bike('Errand Runner').id),
        14200,
        now,
      ).total,
    ).toBe(6);
  });

  it('has one PUC expiring in 9 days and everything else valid', () => {
    const states = data.docs.map((d) => ({ d, s: docStatus(d, now) }));
    const notValid = states.filter((x) => x.s.status !== 'Valid');
    expect(notValid).toHaveLength(1);
    expect(notValid[0].d.type).toBe('PUC');
    expect(notValid[0].s.daysLeft).toBe(9);
  });

  it('has about 90 fuel entries with realistic economy, some partial', () => {
    expect(data.fuel.length).toBeGreaterThanOrEqual(80);
    expect(data.fuel.length).toBeLessThanOrEqual(100);
    expect(data.fuel.some((f) => !f.fullTank)).toBe(true);
    const avg = (nick: string) =>
      fuelStats(data.fuel.filter((f) => f.bikeId === bike(nick).id)).average ?? 0;
    expect(avg('Dusty')).toBeGreaterThan(28);
    expect(avg('Dusty')).toBeLessThan(32);
    expect(avg('Orange Crush')).toBeGreaterThan(26);
    expect(avg('Orange Crush')).toBeLessThan(30);
    expect(avg('Errand Runner')).toBeGreaterThan(45);
    expect(avg('Errand Runner')).toBeLessThan(51);
  });

  it('triggers the mileage alert on the KTM only, with the latest reading ~20% low', () => {
    const stats = (nick: string) => fuelStats(data.fuel.filter((f) => f.bikeId === bike(nick).id));
    expect(stats('Orange Crush').alert).toBe(true);
    expect(stats('Orange Crush').latestDrop).toBeGreaterThan(0.15);
    expect(stats('Orange Crush').latestDrop).toBeLessThan(0.25);
    expect(stats('Dusty').alert).toBe(false);
    expect(stats('Errand Runner').alert).toBe(false);
  });

  it('has ~12 services mixing workshops and DIY, ~25 rides incl. Coorg and Nandi Hills', () => {
    expect(data.services).toHaveLength(12);
    expect(data.services.some((s) => s.where === 'DIY')).toBe(true);
    expect(data.services.some((s) => s.where !== 'DIY')).toBe(true);
    expect(data.rides).toHaveLength(25);
    expect(data.rides.some((r) => r.title.includes('Coorg'))).toBe(true);
    expect(data.rides.some((r) => r.title.includes('Nandi Hills'))).toBe(true);
  });

  it('keeps every bike timeline consistent: later dates never have lower odometers', () => {
    for (const b of data.bikes) {
      const pts = bikeOdoPoints(data, b.id).sort((x, y) =>
        x.date < y.date ? -1 : x.date > y.date ? 1 : x.km - y.km,
      );
      for (let i = 1; i < pts.length; i++) {
        expect(pts[i].km, `${b.nickname} ${pts[i].date}`).toBeGreaterThanOrEqual(pts[i - 1].km);
      }
    }
  });

  it('is deterministic', () => {
    expect(buildSeed(now)).toEqual(data);
  });
});
