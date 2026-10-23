import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { todayISO } from '@/lib/dates';
import { economyReadings } from '@/lib/fuel';
import type { FuelEntry, GarageData } from '@/lib/types';
import { useGarage } from './garage';

/** All persisted collections, re-rendering only when one of them changes. */
export function useData(): GarageData {
  return useGarage(
    useShallow((s) => ({
      bikes: s.bikes,
      schedule: s.schedule,
      services: s.services,
      fuel: s.fuel,
      rides: s.rides,
      docs: s.docs,
      readings: s.readings,
    })),
  );
}

export function useBike(id: string | undefined) {
  return useGarage((s) => (id ? s.bikes.find((b) => b.id === id) : undefined));
}

/** Today as an ISO date; due status is computed on load, so a stable value per mount is enough. */
export function useToday(): string {
  return useMemo(() => todayISO(), []);
}

export const useEconomyUnit = () => useGarage((s) => s.settings.economyUnit);

/** km/l for every fill-up that produced a full-to-full reading, keyed by entry id. */
export function useEconomyReadings(fuel: FuelEntry[]): Map<string, number> {
  return useMemo(() => {
    const byBike = new Map<string, FuelEntry[]>();
    for (const f of fuel) byBike.set(f.bikeId, [...(byBike.get(f.bikeId) ?? []), f]);
    const out = new Map<string, number>();
    for (const entries of byBike.values()) {
      for (const r of economyReadings(entries)) out.set(r.entryId, r.kmpl);
    }
    return out;
  }, [fuel]);
}
