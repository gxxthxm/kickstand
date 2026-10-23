import { describe, expect, it } from 'vitest';
import { bikeOdoPoints, odometerBounds, validateOdometer, type OdoPoint } from './odometer';
import { emptyGarage } from './types';

const points: OdoPoint[] = [
  { id: 'a', date: '2026-10-01', km: 8000 },
  { id: 'b', date: '2026-10-10', km: 8200 },
  { id: 'c', date: '2026-10-20', km: 8400 },
];

describe('validateOdometer', () => {
  it('accepts a reading at or above the current odometer on the latest date', () => {
    expect(validateOdometer(points, '2026-10-22', 8400)).toBeNull();
    expect(validateOdometer(points, '2026-10-22', 8450)).toBeNull();
    expect(validateOdometer(points, '2026-10-20', 8400)).toBeNull();
  });

  it('rejects a reading lower than the current odometer', () => {
    expect(validateOdometer(points, '2026-10-22', 8399)).toMatch(/current odometer \(8,400 km\)/);
  });

  it('accepts a back-dated reading between its neighbours', () => {
    expect(validateOdometer(points, '2026-10-05', 8100)).toBeNull();
    expect(validateOdometer(points, '2026-10-05', 8000)).toBeNull();
    expect(validateOdometer(points, '2026-10-05', 8200)).toBeNull();
  });

  it('rejects a back-dated reading outside its neighbours', () => {
    expect(validateOdometer(points, '2026-10-05', 7990)).toMatch(/already at 8,000 km/);
    expect(validateOdometer(points, '2026-10-05', 8250)).toMatch(/between 8,000 km and 8,200 km/);
  });

  it('allows anything before the first log as long as it is below the next', () => {
    expect(validateOdometer(points, '2026-09-01', 500)).toBeNull();
    expect(validateOdometer(points, '2026-09-01', 8001)).not.toBeNull();
  });

  it('ignores the entry being edited', () => {
    expect(validateOdometer(points, '2026-10-20', 8300, 'c')).toBeNull();
    expect(odometerBounds(points, '2026-10-22', 'c').min).toBe(8200);
  });

  it('rejects junk', () => {
    expect(validateOdometer(points, '2026-10-22', Number.NaN)).not.toBeNull();
    expect(validateOdometer(points, '2026-10-22', -1)).not.toBeNull();
  });
});

describe('bikeOdoPoints', () => {
  it('collects every log for one bike, both ends of a ride', () => {
    const data = emptyGarage();
    data.readings.push({ id: 'r', bikeId: 'x', date: '2026-01-01', odometer: 100 });
    data.fuel.push({
      id: 'f',
      bikeId: 'x',
      date: '2026-01-02',
      odometer: 200,
      litres: 5,
      amount: 500,
      fullTank: true,
    });
    data.rides.push({
      id: 'ride',
      bikeId: 'x',
      date: '2026-01-03',
      title: 't',
      startKm: 200,
      endKm: 300,
      tags: [],
    });
    data.fuel.push({
      id: 'other',
      bikeId: 'y',
      date: '2026-01-02',
      odometer: 999,
      litres: 5,
      amount: 500,
      fullTank: true,
    });
    const kms = bikeOdoPoints(data, 'x').map((p) => p.km);
    expect(kms.sort()).toEqual([100, 200, 200, 300]);
  });
});
