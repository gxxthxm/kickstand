import { describe, expect, it } from 'vitest';
import { reconcileBike } from './reconcile';
import { emptyGarage, type GarageData } from './types';

function garage(): GarageData {
  const d = emptyGarage();
  d.bikes.push({
    id: 'b',
    nickname: 'Test',
    make: 'M',
    model: 'X',
    year: 2024,
    colour: '#fff',
    purchaseDate: '2026-01-01',
    odometer: 1000,
  });
  d.readings.push({ id: 'r0', bikeId: 'b', date: '2026-01-01', odometer: 1000 });
  d.schedule.push({
    id: 'oil',
    bikeId: 'b',
    name: 'Engine oil',
    intervalKm: 3000,
    intervalMonths: 6,
    lastDoneKm: 1000,
    lastDoneDate: '2026-01-01',
    baselineKm: 1000,
    baselineDate: '2026-01-01',
    enabled: true,
  });
  return d;
}

describe('reconcileBike', () => {
  it('sets the odometer to the max of all logs', () => {
    const d = garage();
    d.fuel.push({
      id: 'f',
      bikeId: 'b',
      date: '2026-02-01',
      odometer: 1500,
      litres: 5,
      amount: 500,
      fullTank: true,
    });
    d.rides.push({
      id: 'r',
      bikeId: 'b',
      date: '2026-02-02',
      title: 'x',
      startKm: 1500,
      endKm: 1620,
      tags: [],
    });
    expect(reconcileBike(d, 'b').bikes[0].odometer).toBe(1620);
  });

  it('drops the odometer back when the highest log is deleted', () => {
    const d = garage();
    d.fuel.push({
      id: 'f',
      bikeId: 'b',
      date: '2026-02-01',
      odometer: 99999,
      litres: 5,
      amount: 500,
      fullTank: true,
    });
    const withTypo = reconcileBike(d, 'b');
    expect(withTypo.bikes[0].odometer).toBe(99999);
    const fixed = reconcileBike({ ...withTypo, fuel: [] }, 'b');
    expect(fixed.bikes[0].odometer).toBe(1000);
  });

  it('resets last-done from services, and restores the baseline when they are removed', () => {
    const d = garage();
    d.services.push({
      id: 's',
      bikeId: 'b',
      date: '2026-03-01',
      odometer: 2500,
      itemIds: ['oil'],
      where: 'DIY',
      partsCost: 900,
      labourCost: 0,
    });
    const after = reconcileBike(d, 'b');
    expect(after.schedule[0].lastDoneKm).toBe(2500);
    expect(after.schedule[0].lastDoneDate).toBe('2026-03-01');
    expect(after.bikes[0].odometer).toBe(2500);

    const undone = reconcileBike({ ...after, services: [] }, 'b');
    expect(undone.schedule[0].lastDoneKm).toBe(1000);
    expect(undone.schedule[0].lastDoneDate).toBe('2026-01-01');
  });

  it('ignores services that did not include the item', () => {
    const d = garage();
    d.services.push({
      id: 's',
      bikeId: 'b',
      date: '2026-03-01',
      odometer: 2500,
      itemIds: [],
      where: 'DIY',
      partsCost: 0,
      labourCost: 0,
    });
    expect(reconcileBike(d, 'b').schedule[0].lastDoneKm).toBe(1000);
  });

  it('returns the same object when nothing changed', () => {
    const d = garage();
    expect(reconcileBike(d, 'b')).toBe(d);
  });
});
