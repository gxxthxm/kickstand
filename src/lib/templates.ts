import raw from '@/data/templates.json';
import { uid } from './id';
import type { ISODate, ScheduleItem } from './types';

export interface TemplateItem {
  name: string;
  intervalKm?: number;
  intervalMonths?: number;
}

export interface ScheduleTemplate {
  id: string;
  name: string;
  description: string;
  items: TemplateItem[];
}

export const TEMPLATES: ScheduleTemplate[] = raw;

export const getTemplate = (id: string): ScheduleTemplate | undefined =>
  TEMPLATES.find((t) => t.id === id);

/** Create a bike's schedule from a template, every item last done at the given point. */
export function scheduleFromTemplate(
  template: ScheduleTemplate,
  bikeId: string,
  lastDoneKm: number,
  lastDoneDate: ISODate,
  makeId: () => string = uid,
): ScheduleItem[] {
  return template.items.map((t) => ({
    id: makeId(),
    bikeId,
    name: t.name,
    intervalKm: t.intervalKm,
    intervalMonths: t.intervalMonths,
    lastDoneKm,
    lastDoneDate,
    baselineKm: lastDoneKm,
    baselineDate: lastDoneDate,
    enabled: true,
  }));
}

/** Describe an interval: "3,000 km or 6 months", "600 km", "24 months". */
export function describeInterval(
  item: Pick<TemplateItem, 'intervalKm' | 'intervalMonths'>,
): string {
  const parts: string[] = [];
  if (item.intervalKm) parts.push(`${item.intervalKm.toLocaleString('en-IN')} km`);
  if (item.intervalMonths)
    parts.push(`${item.intervalMonths} month${item.intervalMonths === 1 ? '' : 's'}`);
  return parts.length ? parts.join(' or ') : 'No interval';
}
