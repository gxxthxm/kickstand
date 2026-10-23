import { describe, expect, it } from 'vitest';
import { bikeHealth, compareDue, docMessage, docStatus, dueMessage, itemStatus } from './due';
import type { ScheduleItem } from './types';

const TODAY = '2026-10-22';

const item = (over: Partial<ScheduleItem>): ScheduleItem => ({
  id: 'i',
  bikeId: 'b',
  name: 'Engine oil',
  intervalKm: 3000,
  intervalMonths: 6,
  lastDoneKm: 10000,
  lastDoneDate: '2026-08-22',
  baselineKm: 10000,
  baselineDate: '2026-08-22',
  enabled: true,
  ...over,
});

describe('itemStatus', () => {
  it('is OK well inside both limits', () => {
    const r = itemStatus(item({}), 11000, TODAY);
    expect(r.status).toBe('OK');
    expect(r.kmLeft).toBe(2000);
    expect(r.dueDate).toBe('2027-02-22');
    expect(r.daysLeft).toBe(123);
  });

  it('is Overdue when km is past', () => {
    const r = itemStatus(item({}), 13120, TODAY);
    expect(r.status).toBe('Overdue');
    expect(r.kmLeft).toBe(-120);
    expect(r.by).toBe('km');
  });

  it('is Overdue when time is past even with km to spare', () => {
    const r = itemStatus(item({ lastDoneDate: '2026-04-01' }), 10500, TODAY);
    expect(r.status).toBe('Overdue');
    expect(r.daysLeft).toBeLessThan(0);
    expect(r.by).toBe('time');
  });

  it('is DueSoon at exactly 10% of the km interval', () => {
    expect(itemStatus(item({}), 12700, TODAY).status).toBe('DueSoon');
    expect(itemStatus(item({}), 12699, TODAY).status).toBe('OK');
  });

  it('is DueSoon within 14 days', () => {
    // due 2026-11-05 → 14 days left
    const r = itemStatus(item({ lastDoneDate: '2026-05-05' }), 10100, TODAY);
    expect(r.daysLeft).toBe(14);
    expect(r.status).toBe('DueSoon');
    expect(itemStatus(item({ lastDoneDate: '2026-05-06' }), 10100, TODAY).status).toBe('OK');
  });

  it('treats exactly-due (0 left) as DueSoon, not Overdue', () => {
    expect(itemStatus(item({}), 13000, TODAY).status).toBe('DueSoon');
  });

  it('handles km-only items', () => {
    const r = itemStatus(item({ intervalMonths: undefined, intervalKm: 600 }), 10560, TODAY);
    expect(r.daysLeft).toBeUndefined();
    expect(r.kmLeft).toBe(40);
    expect(r.status).toBe('DueSoon');
    expect(r.progress).toBeCloseTo(560 / 600);
  });

  it('handles time-only items', () => {
    const r = itemStatus(
      item({ intervalKm: undefined, intervalMonths: 24, lastDoneDate: '2025-10-22' }),
      99999,
      TODAY,
    );
    expect(r.kmLeft).toBeUndefined();
    expect(r.status).toBe('OK');
    expect(r.progress).toBeCloseTo(365 / 730, 2);
  });

  it('progress takes the larger of km and time, capped at 1', () => {
    // 1500/3000 km used = 0.5; 61/184 days used ≈ 0.33
    expect(itemStatus(item({}), 11500, TODAY).progress).toBeCloseTo(0.5);
    expect(itemStatus(item({}), 20000, TODAY).progress).toBe(1);
    expect(itemStatus(item({}), 9000, TODAY).progress).toBeGreaterThanOrEqual(0);
  });

  it('sorts Overdue before DueSoon before OK, most urgent first', () => {
    const a = itemStatus(item({}), 13500, TODAY); // overdue 500
    const b = itemStatus(item({}), 13100, TODAY); // overdue 100
    const c = itemStatus(item({}), 12800, TODAY); // due soon
    const d = itemStatus(item({}), 10500, TODAY); // ok
    expect([d, c, b, a].sort(compareDue)).toEqual([a, b, c, d]);
  });
});

describe('bikeHealth', () => {
  it('is the share of enabled items that are OK', () => {
    const items = [
      item({ id: '1' }),
      item({ id: '2', lastDoneKm: 7000 }), // overdue at 11000
      item({ id: '3', enabled: false, lastDoneKm: 0 }),
      item({ id: '4', intervalKm: 600, intervalMonths: undefined, lastDoneKm: 10450 }), // due soon
    ];
    const h = bikeHealth(items, 11000, TODAY);
    expect(h.total).toBe(3);
    expect(h.ok).toBe(1);
    expect(h.overdue).toBe(1);
    expect(h.dueSoon).toBe(1);
    expect(h.ratio).toBeCloseTo(1 / 3);
  });

  it('is 100% with no enabled items', () => {
    expect(bikeHealth([], 0, TODAY).ratio).toBe(1);
  });
});

describe('dueMessage', () => {
  it('talks like a rider', () => {
    const chain = item({
      name: 'Chain clean & lube',
      intervalKm: 600,
      intervalMonths: undefined,
      lastDoneKm: 10000,
    });
    expect(dueMessage(chain.name, itemStatus(chain, 10720, TODAY))).toBe(
      "Chain's thirsty — 120 km past due",
    );
    // 380 km left, 21 days left
    const oil = item({ lastDoneKm: 10000, lastDoneDate: '2026-05-12' });
    expect(dueMessage(oil.name, itemStatus(oil, 12620, TODAY))).toBe(
      'Oil change in 380 km or 3 weeks',
    );
    const coolant = item({
      name: 'Coolant',
      intervalKm: undefined,
      intervalMonths: 24,
      lastDoneDate: '2025-05-22',
    });
    expect(dueMessage(coolant.name, itemStatus(coolant, 0, TODAY))).toBe(
      'Coolant change in 7 months',
    );
  });

  it('leads with the limit that bites first', () => {
    const oil = item({ lastDoneKm: 10000, lastDoneDate: '2026-05-01' }); // 10 days, 3,000 km left
    expect(dueMessage(oil.name, itemStatus(oil, 10000, TODAY))).toBe(
      'Oil change in 10 days or 3,000 km',
    );
  });
});

describe('docStatus', () => {
  it('flags expired, expiring within 30 days and valid', () => {
    expect(docStatus({ expiresAt: '2026-10-21' }, TODAY).status).toBe('Expired');
    expect(docStatus({ expiresAt: '2026-10-22' }, TODAY).status).toBe('Expiring');
    expect(docStatus({ expiresAt: '2026-11-21' }, TODAY).status).toBe('Expiring');
    expect(docStatus({ expiresAt: '2026-11-22' }, TODAY).status).toBe('Valid');
  });

  it('writes the microcopy', () => {
    expect(docMessage({ type: 'PUC' }, docStatus({ expiresAt: '2026-10-31' }, TODAY))).toBe(
      'PUC expires in 9 days',
    );
    expect(docMessage({ type: 'Insurance' }, docStatus({ expiresAt: '2026-10-01' }, TODAY))).toBe(
      'Insurance expired 3 weeks ago',
    );
  });
});
