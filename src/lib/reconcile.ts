import { bikeOdoPoints, maxOdometer } from './odometer';
import type { GarageData, ScheduleItem, ServiceEntry } from './types';

/**
 * The latest time an item was done: its baseline, or any later service that included it.
 * "Latest" is by odometer, then by date.
 */
export function lastDoneFor(
  item: ScheduleItem,
  services: ServiceEntry[],
): { lastDoneKm: number; lastDoneDate: string } {
  let km = item.baselineKm;
  let date = item.baselineDate;
  for (const s of services) {
    if (s.bikeId !== item.bikeId || !s.itemIds.includes(item.id)) continue;
    if (s.odometer > km || (s.odometer === km && s.date > date)) {
      km = s.odometer;
      date = s.date;
    }
  }
  return { lastDoneKm: km, lastDoneDate: date };
}

/**
 * Recompute everything that is derived for one bike: its odometer (max of all logs) and each
 * schedule item's last-done point. Runs after every add, edit, delete and undo, so derived values
 * never drift from the logs.
 */
export function reconcileBike(data: GarageData, bikeId: string): GarageData {
  const bike = data.bikes.find((b) => b.id === bikeId);
  if (!bike) return data;
  const odometer = maxOdometer(bikeOdoPoints(data, bikeId)) ?? bike.odometer;

  let scheduleChanged = false;
  const schedule = data.schedule.map((item) => {
    if (item.bikeId !== bikeId) return item;
    const next = lastDoneFor(item, data.services);
    if (next.lastDoneKm === item.lastDoneKm && next.lastDoneDate === item.lastDoneDate) return item;
    scheduleChanged = true;
    return { ...item, ...next };
  });

  if (odometer === bike.odometer && !scheduleChanged) return data;
  return {
    ...data,
    bikes: data.bikes.map((b) => (b.id === bikeId ? { ...b, odometer } : b)),
    schedule: scheduleChanged ? schedule : data.schedule,
  };
}
