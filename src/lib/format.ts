import { format, isSameYear } from 'date-fns';
import { parseDate } from './dates';
import type { ISODate } from './types';

const inr0 = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const inr2 = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** "8,400 km" — Indian digit grouping (1,23,456). */
export const formatKm = (n: number): string => `${inr0.format(Math.round(n))} km`;

export const formatNumber = (n: number, digits = 0): string =>
  new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(n);

/** "₹12,450" */
export const formatMoney = (n: number): string => `₹${inr0.format(Math.round(n))}`;

/** "₹103.12" — for per-litre and per-km prices. */
export const formatMoneyPrecise = (n: number): string => `₹${inr2.format(n)}`;

/** "₹1.2k", "₹3.4L" for chart axes. */
export function formatMoneyCompact(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1).replace(/\.0$/, '')}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return `₹${Math.round(n)}`;
}

/** "22 Oct", or "22 Oct 2025" outside the current year. */
export function formatDate(d: ISODate | Date, now: Date = new Date()): string {
  const date = parseDate(d);
  return isSameYear(date, now) ? format(date, 'd MMM') : format(date, 'd MMM yyyy');
}

export const formatDateLong = (d: ISODate | Date): string =>
  format(parseDate(d), 'EEE, d MMM yyyy');

/** Parse a user-typed number, tolerating commas and spaces. Returns NaN when empty. */
export function parseNumber(s: string): number {
  const cleaned = s.replace(/[,\s₹]/g, '');
  if (cleaned === '') return Number.NaN;
  return Number(cleaned);
}
