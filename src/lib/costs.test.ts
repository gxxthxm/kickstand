import { describe, expect, it } from 'vitest';
import { costBreakdown, dataSpanDays, docCostDate, monthlyCosts } from './costs';
import { emptyGarage, type GarageData } from './types';

function garage(): GarageData {
  const d = emptyGarage();
  d.bikes.push(
    {
      id: 'a',
      nickname: 'A',
      make: '',
      model: '',
      year: 2024,
      colour: '#000',
      purchaseDate: '2025-01-01',
      odometer: 2000,
    },
    {
      id: 'b',
      nickname: 'B',
      make: '',
      model: '',
      year: 2024,
      colour: '#000',
      purchaseDate: '2025-01-01',
      odometer: 600,
    },
  );
  d.readings.push(
    { id: 'ra', bikeId: 'a', date: '2026-01-01', odometer: 1000 },
    { id: 'rb', bikeId: 'b', date: '2026-01-01', odometer: 500 },
  );
  d.fuel.push(
    {
      id: 'f1',
      bikeId: 'a',
      date: '2026-09-03',
      odometer: 1500,
      litres: 10,
      amount: 1000,
      fullTank: true,
    },
    {
      id: 'f2',
      bikeId: 'a',
      date: '2026-10-03',
      odometer: 2000,
      litres: 10,
      amount: 1000,
      fullTank: true,
    },
    {
      id: 'f3',
      bikeId: 'b',
      date: '2026-10-04',
      odometer: 600,
      litres: 2,
      amount: 200,
      fullTank: true,
    },
  );
  d.services.push({
    id: 's',
    bikeId: 'a',
    date: '2026-10-10',
    odometer: 2000,
    itemIds: [],
    where: 'Shop',
    partsCost: 800,
    labourCost: 400,
  });
  d.docs.push(
    {
      id: 'd1',
      bikeId: 'a',
      type: 'Insurance',
      expiresAt: '2027-08-31',
      issuedAt: '2026-09-01',
      cost: 3000,
    },
    { id: 'd2', bikeId: 'a', type: 'PUC', expiresAt: '2027-03-15' },
  );
  return d;
}

describe('costBreakdown', () => {
  it('splits totals into fuel, service, parts and documents', () => {
    const c = costBreakdown(garage(), 'a');
    expect(c).toMatchObject({ fuel: 2000, service: 400, parts: 800, documents: 3000, total: 6200 });
  });

  it('computes cost per km over the distance we have logs for', () => {
    const c = costBreakdown(garage(), 'a');
    expect(c.kmTracked).toBe(1000);
    expect(c.costPerKm).toBeCloseTo(6.2);
  });

  it('sums all bikes when no bike is given', () => {
    const c = costBreakdown(garage());
    expect(c.total).toBe(6400);
    expect(c.kmTracked).toBe(1100);
  });

  it('has no cost per km without distance', () => {
    const d = emptyGarage();
    expect(costBreakdown(d).costPerKm).toBeUndefined();
  });
});

describe('monthlyCosts', () => {
  it('returns 12 months ending this month, oldest first', () => {
    const m = monthlyCosts(garage(), '2026-10-22');
    expect(m).toHaveLength(12);
    expect(m[0].month).toBe('2025-11');
    expect(m[11].month).toBe('2026-10');
    expect(m[2].label).toBe("Jan '26");
  });

  it('buckets each cost into its month and category', () => {
    const m = monthlyCosts(garage(), '2026-10-22');
    const oct = m[11];
    const sep = m[10];
    expect(oct).toMatchObject({ fuel: 1200, service: 400, parts: 800, documents: 0, total: 2400 });
    expect(sep).toMatchObject({ fuel: 1000, documents: 3000, total: 4000 });
  });

  it('filters by bike', () => {
    const oct = monthlyCosts(garage(), '2026-10-22', 12, 'b')[11];
    expect(oct.total).toBe(200);
  });

  it('dates document costs by issue date, or by typical validity', () => {
    expect(docCostDate({ id: 'x', bikeId: 'a', type: 'PUC', expiresAt: '2027-03-15' })).toBe(
      '2026-03-15',
    );
  });
});

describe('dataSpanDays', () => {
  it('measures first to last dated log', () => {
    expect(dataSpanDays(garage())).toBe(37);
    expect(dataSpanDays(emptyGarage())).toBe(0);
  });
});
