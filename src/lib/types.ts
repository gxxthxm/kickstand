export type ItemStatus = 'Overdue' | 'DueSoon' | 'OK';
export type DocType = 'Insurance' | 'PUC' | 'Registration' | 'Licence';
export type DocStatus = 'Expired' | 'Expiring' | 'Valid';
export type EconomyUnit = 'kmpl' | 'l100km';
export type Theme = 'dark' | 'light';

/** ISO calendar date, `yyyy-MM-dd`. */
export type ISODate = string;

export interface Bike {
  id: string;
  nickname: string;
  make: string;
  model: string;
  year: number;
  /** Hex colour for the swatch and card tint. */
  colour: string;
  purchaseDate: ISODate;
  purchasePrice?: number;
  /** Derived max of all logs, stored for speed. */
  odometer: number;
}

export interface ScheduleItem {
  id: string;
  bikeId: string;
  name: string;
  intervalKm?: number;
  intervalMonths?: number;
  /** Derived: the latest of the baseline and every service that included this item. */
  lastDoneKm: number;
  lastDoneDate: ISODate;
  /** When the item was last done before any logged service (set on create or edit). */
  baselineKm: number;
  baselineDate: ISODate;
  enabled: boolean;
}

export interface ServiceEntry {
  id: string;
  bikeId: string;
  date: ISODate;
  odometer: number;
  /** Schedule items reset by this service. */
  itemIds: string[];
  /** 'DIY' or a workshop name. */
  where: 'DIY' | (string & {});
  partsCost: number;
  labourCost: number;
  notes?: string;
}

export interface FuelEntry {
  id: string;
  bikeId: string;
  date: ISODate;
  odometer: number;
  litres: number;
  amount: number;
  fullTank: boolean;
  station?: string;
}

export interface Ride {
  id: string;
  bikeId: string;
  date: ISODate;
  title: string;
  startKm: number;
  endKm: number;
  rating?: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  notes?: string;
}

export interface BikeDoc {
  id: string;
  bikeId: string;
  type: DocType;
  number?: string;
  expiresAt: ISODate;
  /** When it was issued or renewed; used to place its cost on the monthly chart. */
  issuedAt?: ISODate;
  cost?: number;
}

/** A plain odometer reading ("Update odometer"), including the one a bike starts with. */
export interface OdoReading {
  id: string;
  bikeId: string;
  date: ISODate;
  odometer: number;
}

export interface GarageData {
  bikes: Bike[];
  schedule: ScheduleItem[];
  services: ServiceEntry[];
  fuel: FuelEntry[];
  rides: Ride[];
  docs: BikeDoc[];
  readings: OdoReading[];
}

export interface Settings {
  economyUnit: EconomyUnit;
  theme: Theme;
  bannerDismissed: boolean;
}

export const RIDE_TAGS = ['Commute', 'Weekend', 'Tour', 'Track day'] as const;
export const DOC_TYPES: DocType[] = ['Insurance', 'PUC', 'Registration', 'Licence'];

export const emptyGarage = (): GarageData => ({
  bikes: [],
  schedule: [],
  services: [],
  fuel: [],
  rides: [],
  docs: [],
  readings: [],
});
