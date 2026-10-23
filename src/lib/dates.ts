import { addMonths, differenceInCalendarDays, format, parseISO } from 'date-fns';
import type { ISODate } from './types';

export const toISODate = (d: Date): ISODate => format(d, 'yyyy-MM-dd');

export const todayISO = (): ISODate => toISODate(new Date());

export const parseDate = (d: ISODate | Date): Date => (typeof d === 'string' ? parseISO(d) : d);

export const daysBetween = (from: ISODate | Date, to: ISODate | Date): number =>
  differenceInCalendarDays(parseDate(to), parseDate(from));

export const addMonthsISO = (d: ISODate, months: number): ISODate =>
  toISODate(addMonths(parseDate(d), months));

/** Compare two ISO dates; works because the format sorts lexically. */
export const compareISO = (a: ISODate, b: ISODate): number => (a < b ? -1 : a > b ? 1 : 0);

/**
 * Friendly span for microcopy: "today", "1 day", "9 days", "3 weeks", "4 months", "2 years".
 * Always pass a non-negative number.
 */
export function humanizeDays(days: number): string {
  const n = Math.abs(Math.round(days));
  if (n === 0) return 'today';
  if (n === 1) return '1 day';
  if (n < 14) return `${n} days`;
  if (n < 60) {
    const w = Math.round(n / 7);
    return `${w} weeks`;
  }
  if (n < 730) {
    const m = Math.round(n / 30.44);
    return m === 1 ? '1 month' : `${m} months`;
  }
  const y = Math.round(n / 365.25);
  return y === 1 ? '1 year' : `${y} years`;
}
