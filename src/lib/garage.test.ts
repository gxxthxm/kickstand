import { describe, expect, it } from 'vitest';
import { buildSeed } from '@/data/seed';
import { activity, attentionList, groupByMonth } from './garage';

const NOW = new Date(2026, 9, 22);
const data = buildSeed(NOW);

describe('activity', () => {
  it('lists every log across bikes, newest first', () => {
    const all = activity(data);
    expect(all).toHaveLength(
      data.fuel.length + data.rides.length + data.services.length + data.readings.length,
    );
    for (let i = 1; i < all.length; i++) expect(all[i].date <= all[i - 1].date).toBe(true);
  });

  it('filters by bike and by kind', () => {
    const ktm = 'seed-bike-orange';
    const fuel = activity(data, { bikeId: ktm, kinds: ['fuel'] });
    expect(fuel.length).toBe(data.fuel.filter((f) => f.bikeId === ktm).length);
    expect(fuel.every((a) => a.kind === 'fuel' && a.bikeId === ktm)).toBe(true);
  });

  it('carries the cost of each log', () => {
    const svc = activity(data, { kinds: ['service'] });
    const total = svc.reduce((s, a) => s + a.cost, 0);
    expect(total).toBe(data.services.reduce((s, x) => s + x.partsCost + x.labourCost, 0));
    expect(activity(data, { kinds: ['ride'] }).every((a) => a.cost === 0)).toBe(true);
  });
});

describe('groupByMonth', () => {
  it('groups consecutive months and totals their cost', () => {
    const groups = groupByMonth(activity(data, { kinds: ['fuel'] }));
    expect(groups[0].month).toBe('2026-10');
    expect(new Set(groups.map((g) => g.month)).size).toBe(groups.length);
    const sum = groups.reduce((s, g) => s + g.cost, 0);
    expect(sum).toBeCloseTo(data.fuel.reduce((s, f) => s + f.amount, 0));
  });
});

describe('attentionList', () => {
  it('sorts overdue before due soon and includes expiring papers', () => {
    const rows = attentionList(data, '2026-10-22');
    expect(rows[0].status).toBe('Overdue');
    expect(rows.map((r) => r.status)).toEqual(
      [...rows.map((r) => r.status)].sort((a, b) =>
        a === b ? 0 : a === 'Overdue' ? -1 : b === 'Overdue' ? 1 : 0,
      ),
    );
    expect(rows.some((r) => r.kind === 'doc' && r.message === 'PUC expires in 9 days')).toBe(true);
  });
});
