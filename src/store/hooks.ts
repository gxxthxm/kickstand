import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { todayISO } from '@/lib/dates';
import type { GarageData } from '@/lib/types';
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
