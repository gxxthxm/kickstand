/**
 * Demo garage, generated on first run with every date relative to today.
 *
 * Each bike gets a simulated year: daily commutes plus named weekend rides build an odometer
 * timeline, a tank model produces fill-ups (full and partial) along it, and services sit at fixed
 * odometer points. Because everything hangs off one timeline the logs are always consistent, and
 * the schedule lands on the brief's states: 1 overdue (KTM chain adjust, 120 km past), 3 due soon,
 * the rest OK, plus one PUC expiring in 9 days.
 */
import { addDays, addMonths, addYears, startOfWeek, subDays, subMonths } from 'date-fns';
import { toISODate } from '@/lib/dates';
import { reconcileBike } from '@/lib/reconcile';
import { getTemplate, scheduleFromTemplate } from '@/lib/templates';
import type {
  Bike,
  BikeDoc,
  DocType,
  FuelEntry,
  GarageData,
  OdoReading,
  Ride,
  ServiceEntry,
} from '@/lib/types';

const DAYS = 365;

interface RideSpec {
  /** Weeks before the current week. */
  week: number;
  /** 0 = Sunday … 6 = Saturday */
  dow: number;
  title: string;
  km: number;
  tags: string[];
  rating?: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  /** Where to fill up if the tank runs low on this ride. */
  station?: string;
}

interface ServiceSpec {
  /** Service at this exact odometer… */
  atKm?: number;
  /** …or on this date (odometer taken from the timeline). */
  atDate?: (today: Date) => Date;
  where: string;
  items: string[];
  parts: number;
  labour: number;
  notes?: string;
}

interface DocSpec {
  type: DocType;
  number: string;
  issued: (today: Date) => Date;
  expires: (today: Date) => Date;
  cost?: number;
}

interface BikeSpec {
  key: string;
  nickname: string;
  make: string;
  model: string;
  year: number;
  colour: string;
  template: string;
  purchase: (today: Date) => Date;
  purchasePrice: number;
  startKm: number;
  endKm: number;
  weekdayKm: number;
  weekendKm: number;
  restChance: number;
  tankL: number;
  kmpl: number;
  /** Fill up when the tank drops into this range (litres). */
  fillAt: [number, number];
  partialChance: number;
  partialAmounts: number[];
  stations: string[];
  /** Latest full-to-full reading drops to this share of normal (mileage alert). */
  latestDropTo?: number;
  disabledItems?: string[];
  rides: RideSpec[];
  services: ServiceSpec[];
  docs: DocSpec[];
}

const SPECS: BikeSpec[] = [
  {
    key: 'dusty',
    nickname: 'Dusty',
    make: 'Royal Enfield',
    model: 'Himalayan 450',
    year: 2024,
    colour: '#C08A4E',
    template: 'adventure',
    purchase: (t) => subMonths(t, 14),
    purchasePrice: 340000,
    startKm: 600,
    endKm: 8400,
    weekdayKm: 16,
    weekendKm: 30,
    restChance: 0.3,
    tankL: 17,
    kmpl: 30,
    fillAt: [5.5, 8],
    partialChance: 0.15,
    partialAmounts: [500, 500, 1000],
    stations: [
      'Indian Oil, Koramangala',
      'HP, Hosur Road',
      'Shell, HSR Layout',
      'Bharat Petroleum, Sarjapur Road',
    ],
    rides: [
      {
        week: 9,
        dow: 6,
        title: 'Coorg weekend — day 1',
        km: 268,
        tags: ['Weekend', 'Tour'],
        rating: 5,
        notes:
          'Breakfast at Kamat in Mysuru. Rain from Kushalnagar onwards, mist all the way into Madikeri.',
        station: 'Indian Oil, Kushalnagar',
      },
      {
        week: 9,
        dow: 0,
        title: 'Coorg weekend — day 2',
        km: 281,
        tags: ['Weekend', 'Tour'],
        rating: 4,
        notes: 'Abbey Falls at 8, home by dusk. Chain was crying for lube after two wet days.',
        station: 'HP, Hunsur',
      },
      { week: 2, dow: 0, title: 'Ramanagara loop', km: 118, tags: ['Weekend'], rating: 4 },
      {
        week: 5,
        dow: 3,
        title: 'Office — ORR crawl',
        km: 31,
        tags: ['Commute'],
        rating: 2,
        notes: 'Silk Board. Need I say more.',
      },
      { week: 14, dow: 6, title: 'Skandagiri pre-dawn', km: 142, tags: ['Weekend'], rating: 4 },
      {
        week: 22,
        dow: 6,
        title: 'Sakleshpur ghats',
        km: 452,
        tags: ['Weekend', 'Tour'],
        rating: 5,
        notes: 'Shiradi ghat closed for work, took the Bisle road. Leeches at the viewpoint.',
        station: 'Indian Oil, Hassan',
      },
      {
        week: 31,
        dow: 6,
        title: 'Chikkamagaluru coffee run',
        km: 498,
        tags: ['Weekend', 'Tour'],
        rating: 5,
        notes: 'Mullayanagiri at sunset. Bought two kilos of estate coffee.',
        station: 'Bharat Petroleum, Kadur',
      },
      { week: 40, dow: 0, title: 'Hosur highway breakfast', km: 96, tags: ['Weekend'], rating: 3 },
      { week: 46, dow: 6, title: 'Muthyala Maduvu falls', km: 88, tags: ['Weekend'], rating: 4 },
      {
        week: 49,
        dow: 0,
        title: 'First long ride — Mysuru',
        km: 296,
        tags: ['Weekend', 'Tour'],
        rating: 5,
        notes: 'Running-in done. Opened her up to 110 on the expressway.',
      },
    ],
    services: [
      {
        atKm: 1000,
        where: 'Eastern Motors (Royal Enfield), Koramangala',
        items: ['Engine oil', 'Chain clean & lube', 'Chain adjust', 'Air filter'],
        parts: 1180,
        labour: 0,
        notes: 'First free service. Motul 10W-50, 2.2 L.',
      },
      {
        atKm: 3900,
        where: 'Eastern Motors (Royal Enfield), Koramangala',
        items: [
          'Engine oil',
          'Chain clean & lube',
          'Chain adjust',
          'Brake pads inspect',
          'Tyres inspect',
        ],
        parts: 1640,
        labour: 650,
        notes: 'Second service. Rear pads at about 70%.',
      },
      {
        atKm: 5300,
        where: 'DIY',
        items: ['Chain clean & lube', 'Chain adjust'],
        parts: 450,
        labour: 0,
        notes: 'Motul C1 + C2 kit. Rear wheel moved half a notch.',
      },
      {
        atKm: 6000,
        where: 'Eastern Motors (Royal Enfield), Koramangala',
        items: ['Engine oil', 'Chain clean & lube', 'Brake pads inspect', 'Tyres inspect'],
        parts: 1720,
        labour: 700,
        notes: 'Third service. Front tyre about 60% left.',
      },
      {
        atKm: 7840,
        where: 'DIY',
        items: ['Chain clean & lube', 'Chain adjust'],
        parts: 0,
        labour: 0,
        notes: 'Kerosene clean after the wet weekend. Slack set to 25 mm.',
      },
    ],
    docs: [
      {
        type: 'Insurance',
        number: '3005/HIM/2291847/00/000',
        issued: (t) => subMonths(t, 2),
        expires: (t) => subDays(addMonths(t, 10), 1),
        cost: 5240,
      },
      {
        type: 'PUC',
        number: 'KA51-PUC-118274',
        issued: (t) => subMonths(t, 5),
        expires: (t) => addMonths(t, 7),
        cost: 100,
      },
      {
        type: 'Registration',
        number: 'KA 51 HZ 4821',
        issued: (t) => subMonths(t, 14),
        expires: (t) => addYears(subMonths(t, 14), 15),
      },
      {
        type: 'Licence',
        number: 'KA05 20190012345',
        issued: (t) => subYears(t, 7),
        expires: (t) => addYears(t, 13),
      },
    ],
  },
  {
    key: 'orange',
    nickname: 'Orange Crush',
    make: 'KTM',
    model: '390 Duke',
    year: 2023,
    colour: '#F26B1D',
    template: 'naked',
    purchase: (t) => subMonths(t, 34),
    purchasePrice: 345000,
    startKm: 12900,
    endKm: 21700,
    weekdayKm: 24,
    weekendKm: 26,
    restChance: 0.2,
    tankL: 15,
    kmpl: 28,
    fillAt: [5.5, 7.5],
    partialChance: 0.12,
    partialAmounts: [500, 1000],
    stations: ['Shell, Indiranagar', 'Indian Oil, Old Airport Road', 'HP, Whitefield'],
    latestDropTo: 0.79,
    rides: [
      {
        week: 3,
        dow: 0,
        title: 'Nandi Hills sunrise',
        km: 124,
        tags: ['Weekend'],
        rating: 5,
        notes: 'Left at 4:45, gates opened at 6. Clouds below us. Worth every yawn.',
      },
      {
        week: 1,
        dow: 4,
        title: 'Commute — Whitefield',
        km: 42,
        tags: ['Commute'],
        rating: 2,
        notes: 'Felt sluggish pulling away. Check chain and tyre pressure.',
      },
      { week: 7, dow: 0, title: 'Kanakapura twisties', km: 142, tags: ['Weekend'], rating: 4 },
      {
        week: 12,
        dow: 6,
        title: 'Mysuru palace run',
        km: 296,
        tags: ['Weekend', 'Tour'],
        rating: 4,
        station: 'Shell, Mandya',
      },
      {
        week: 17,
        dow: 5,
        title: 'Night ride — Airport Road',
        km: 68,
        tags: ['Weekend'],
        rating: 3,
      },
      {
        week: 20,
        dow: 1,
        title: 'Rain commute',
        km: 38,
        tags: ['Commute'],
        rating: 1,
        notes: 'Soaked to the bone. Buy a rain liner.',
      },
      {
        week: 26,
        dow: 6,
        title: 'Track day — MMRT, Chennai',
        km: 410,
        tags: ['Track day'],
        rating: 5,
        notes: 'Best lap 2:21. Pressures 28/30 cold.',
        station: 'Indian Oil, Krishnagiri',
      },
      {
        week: 34,
        dow: 6,
        title: 'Yelagiri hills',
        km: 324,
        tags: ['Weekend', 'Tour'],
        rating: 4,
        station: 'HP, Vaniyambadi',
      },
      { week: 39, dow: 0, title: 'Bannerghatta loop', km: 64, tags: ['Weekend'], rating: 3 },
      { week: 44, dow: 0, title: 'Coffee in Devanahalli', km: 82, tags: ['Weekend'], rating: 3 },
    ],
    services: [
      {
        atKm: 13800,
        where: 'DIY',
        items: ['Chain clean & lube'],
        parts: 0,
        labour: 0,
        notes: 'Quick lube before the weekend.',
      },
      {
        atKm: 15000,
        where: 'Speed Bikes (KTM), Indiranagar',
        items: [
          'Engine oil',
          'Air filter',
          'Spark plug',
          'Coolant',
          'Chain clean & lube',
          'Chain adjust',
          'Brake pads inspect',
          'Tyres inspect',
        ],
        parts: 5420,
        labour: 1350,
        notes: '15k major service. New plug, coolant flush, air filter replaced.',
      },
      {
        atKm: 18960,
        where: 'Moto Garage, HSR Layout',
        items: ['Engine oil', 'Chain clean & lube', 'Brake pads inspect', 'Tyres inspect'],
        parts: 2380,
        labour: 600,
        notes: 'Motul 7100 10W-50. Rear pads at about 40%.',
      },
      {
        atKm: 20580,
        where: 'DIY',
        items: ['Chain clean & lube', 'Chain adjust'],
        parts: 520,
        labour: 0,
        notes: 'New chain lube can. Slack set to 30 mm.',
      },
      {
        atKm: 21450,
        where: 'DIY',
        items: ['Chain clean & lube'],
        parts: 0,
        labour: 0,
        notes: 'Lube only — ran out of light before adjusting.',
      },
    ],
    docs: [
      {
        type: 'Insurance',
        number: 'OG-24-1901-1801-00021934',
        issued: (t) => subMonths(t, 8),
        expires: (t) => subDays(addMonths(t, 4), 1),
        cost: 7950,
      },
      {
        type: 'PUC',
        number: 'KA03-PUC-552190',
        issued: (t) => subYears(addDays(t, 9), 1),
        expires: (t) => addDays(t, 9),
        cost: 120,
      },
      {
        type: 'Registration',
        number: 'KA 03 MT 7712',
        issued: (t) => subMonths(t, 34),
        expires: (t) => addYears(subMonths(t, 34), 15),
      },
    ],
  },
  {
    key: 'activa',
    nickname: 'Errand Runner',
    make: 'Honda',
    model: 'Activa 6G',
    year: 2023,
    colour: '#3E7FD6',
    template: 'scooter',
    purchase: (t) => subMonths(t, 37),
    purchasePrice: 92000,
    startKm: 9600,
    endKm: 14200,
    weekdayKm: 12,
    weekendKm: 14,
    restChance: 0.25,
    tankL: 5.3,
    kmpl: 48,
    fillAt: [1.6, 2.3],
    partialChance: 0.18,
    partialAmounts: [200, 200, 300],
    stations: ['Bharat Petroleum, Jayanagar', 'Indian Oil, JP Nagar'],
    disabledItems: ['Coolant'],
    rides: [
      { week: 1, dow: 6, title: 'Groceries — 4th Block', km: 9, tags: ['Commute'], rating: 3 },
      { week: 6, dow: 0, title: 'Lalbagh flower show', km: 14, tags: ['Weekend'], rating: 4 },
      {
        week: 11,
        dow: 2,
        title: 'Office — JP Nagar to Koramangala',
        km: 22,
        tags: ['Commute'],
        rating: 3,
      },
      { week: 24, dow: 0, title: 'Banashankari temple', km: 12, tags: ['Weekend'], rating: 4 },
      {
        week: 36,
        dow: 6,
        title: "Parents' place, Basavanagudi",
        km: 18,
        tags: ['Weekend'],
        rating: 5,
      },
    ],
    services: [
      {
        atKm: 10000,
        where: 'Wings Honda, Jayanagar',
        items: ['Engine oil', 'Air filter', 'Spark plug', 'Brake pads inspect', 'Tyres inspect'],
        parts: 1450,
        labour: 450,
        notes: 'Paid service. Spark plug replaced.',
      },
      // Lands so that engine oil is due by time in 10 days.
      {
        atDate: (t) => subMonths(addDays(t, 10), 6),
        where: 'Wings Honda, Jayanagar',
        items: ['Engine oil', 'Brake pads inspect', 'Tyres inspect'],
        parts: 680,
        labour: 350,
        notes: 'Oil change, brake shoes adjusted.',
      },
    ],
    docs: [
      {
        type: 'Insurance',
        number: '2311/ACT/7720193/00/000',
        issued: (t) => subMonths(t, 5),
        expires: (t) => subDays(addMonths(t, 7), 1),
        cost: 2460,
      },
      {
        type: 'PUC',
        number: 'KA05-PUC-903317',
        issued: (t) => subMonths(t, 9),
        expires: (t) => addMonths(t, 3),
        cost: 80,
      },
      {
        type: 'Registration',
        number: 'KA 05 JE 3390',
        issued: (t) => subMonths(t, 37),
        expires: (t) => addYears(subMonths(t, 37), 15),
      },
    ],
  },
];

function subYears(d: Date, n: number): Date {
  return addYears(d, -n);
}

/** Small deterministic PRNG so the demo is identical on every reset. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round2 = (n: number) => Math.round(n * 100) / 100;

interface Timeline {
  dates: Date[];
  /** Odometer at the end of each day; index 0 is the start reading a year ago. */
  dayEnd: number[];
  rideOn: Map<number, RideSpec>;
}

function rideDate(today: Date, r: RideSpec): Date {
  return addDays(startOfWeek(today, { weekStartsOn: 0 }), -7 * r.week + r.dow);
}

function buildTimeline(spec: BikeSpec, today: Date, rng: () => number): Timeline {
  const dates: Date[] = [];
  for (let i = 0; i <= DAYS; i++) dates.push(subDays(today, DAYS - i));
  const indexOf = new Map(dates.map((d, i) => [toISODate(d), i]));

  const rideOn = new Map<number, RideSpec>();
  for (const r of spec.rides) {
    const i = indexOf.get(toISODate(rideDate(today, r)));
    if (i !== undefined && i > 0) rideOn.set(i, r);
  }

  const raw: number[] = [0];
  for (let i = 1; i <= DAYS; i++) {
    if (rideOn.has(i)) {
      raw.push(0);
      continue;
    }
    const dow = dates[i].getDay();
    const weekend = dow === 0 || dow === 6;
    const rest = rng() < spec.restChance + (weekend ? 0.15 : 0);
    const base = weekend ? spec.weekendKm : spec.weekdayKm;
    raw.push(rest ? 0 : base * (0.6 + 0.8 * rng()));
  }

  const ridesKm = [...rideOn.values()].reduce((s, r) => s + r.km, 0);
  const rawSum = raw.reduce((s, x) => s + x, 0);
  const scale = (spec.endKm - spec.startKm - ridesKm) / rawSum;

  const dayEnd = [spec.startKm];
  let commute = 0;
  let rides = 0;
  for (let i = 1; i <= DAYS; i++) {
    commute += raw[i] * scale;
    rides += rideOn.get(i)?.km ?? 0;
    dayEnd.push(spec.startKm + rides + Math.round(commute));
  }
  dayEnd[DAYS] = spec.endKm;
  return { dates, dayEnd, rideOn };
}

/** Petrol price in Bengaluru drifts a little over the year; Shell runs slightly higher. */
function pricePerLitre(dayIndex: number, station: string): number {
  const base = dayIndex < 130 ? 102.86 : dayIndex < 250 ? 103.44 : 102.92;
  return round2(base + (station.startsWith('Shell') ? 1.8 : 0));
}

interface SimFill {
  day: number;
  odometer: number;
  litres: number;
  amount: number;
  fullTank: boolean;
  station: string;
}

function simulateFuel(
  spec: BikeSpec,
  tl: Timeline,
  seed: number,
  low?: { fromKm: number; factor: number },
): SimFill[] {
  const rng = mulberry32(seed);
  const rollEcon = () => spec.kmpl * (1 + (rng() + rng() + rng() - 1.5) * 0.07);
  const rollThreshold = () => spec.fillAt[0] + rng() * (spec.fillAt[1] - spec.fillAt[0]);

  const fills: SimFill[] = [];
  let level = spec.tankL;
  let econ = rollEcon();
  let threshold = rollThreshold();

  for (let i = 1; i <= DAYS; i++) {
    let pos = tl.dayEnd[i - 1];
    const end = tl.dayEnd[i];
    while (pos < end) {
      const step = Math.min(5, end - pos);
      pos += step;
      const e = low && pos > low.fromKm ? spec.kmpl * low.factor : econ;
      level -= step / e;
      if (level > threshold) continue;

      const rPartial = rng();
      const rAmount = rng();
      const rStation = rng();
      const ride = tl.rideOn.get(i);
      const station = ride?.station ?? spec.stations[Math.floor(rStation * spec.stations.length)];
      const price = pricePerLitre(i, station);
      const forceFull = low !== undefined && pos >= low.fromKm;

      let fullTank = forceFull || rPartial >= spec.partialChance;
      let litres = 0;
      let amount = 0;
      if (!fullTank) {
        amount = spec.partialAmounts[Math.floor(rAmount * spec.partialAmounts.length)];
        litres = round2(amount / price);
        if (litres >= spec.tankL - level - 0.3) fullTank = true;
      }
      if (fullTank) {
        litres = round2(spec.tankL - level);
        amount = round2(litres * price);
        level = spec.tankL;
      } else {
        level += litres;
      }
      fills.push({
        day: i,
        odometer: Math.round(pos),
        litres,
        amount,
        fullTank,
        station,
      });
      econ = rollEcon();
      threshold = rollThreshold();
    }
  }
  return fills;
}

export function buildSeed(now: Date = new Date()): GarageData {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayISO = toISODate(today);
  let n = 0;
  const id = (prefix: string) => `seed-${prefix}-${++n}`;

  let data: GarageData = {
    bikes: [],
    schedule: [],
    services: [],
    fuel: [],
    rides: [],
    docs: [],
    readings: [],
  };

  SPECS.forEach((spec, bikeIndex) => {
    const seed = 1000 + bikeIndex * 77;
    const tl = buildTimeline(spec, today, mulberry32(seed));
    const bikeId = `seed-bike-${spec.key}`;
    const purchaseDate = toISODate(spec.purchase(today));

    const bike: Bike = {
      id: bikeId,
      nickname: spec.nickname,
      make: spec.make,
      model: spec.model,
      year: spec.year,
      colour: spec.colour,
      purchaseDate,
      purchasePrice: spec.purchasePrice,
      odometer: spec.endKm,
    };

    const template = getTemplate(spec.template);
    if (!template) throw new Error(`Missing template ${spec.template}`);
    const schedule = scheduleFromTemplate(template, bikeId, 0, purchaseDate, () => id('item')).map(
      (item) => ({ ...item, enabled: !spec.disabledItems?.includes(item.name) }),
    );
    const itemId = (name: string) => {
      const item = schedule.find((s) => s.name === name);
      if (!item) throw new Error(`${spec.nickname} has no item ${name}`);
      return item.id;
    };

    const readings: OdoReading[] = [
      { id: id('odo'), bikeId, date: toISODate(tl.dates[0]), odometer: spec.startKm },
      { id: id('odo'), bikeId, date: todayISO, odometer: spec.endKm },
    ];

    const rides: Ride[] = [...tl.rideOn.entries()]
      .sort(([a], [b]) => a - b)
      .map(([i, r]) => ({
        id: id('ride'),
        bikeId,
        date: toISODate(tl.dates[i]),
        title: r.title,
        startKm: tl.dayEnd[i - 1],
        endKm: tl.dayEnd[i],
        rating: r.rating,
        tags: r.tags,
        notes: r.notes,
      }));

    let fills = simulateFuel(spec, tl, seed + 1);
    if (spec.latestDropTo && fills.length >= 2) {
      // Re-run with the last full-to-full segment burning more fuel, so the alert fires.
      const fromKm = fills[fills.length - 2].odometer;
      fills = simulateFuel(spec, tl, seed + 1, { fromKm, factor: spec.latestDropTo });
    }
    const fuel: FuelEntry[] = fills.map((f) => ({
      id: id('fuel'),
      bikeId,
      date: toISODate(tl.dates[f.day]),
      odometer: f.odometer,
      litres: f.litres,
      amount: f.amount,
      fullTank: f.fullTank,
      station: f.station,
    }));

    const services: ServiceEntry[] = spec.services.map((s) => {
      let day: number;
      let odometer: number;
      if (s.atKm !== undefined) {
        day = tl.dayEnd.findIndex((km) => km >= (s.atKm as number));
        odometer = s.atKm;
      } else {
        const iso = toISODate((s.atDate as (t: Date) => Date)(today));
        day = tl.dates.findIndex((d) => toISODate(d) === iso);
        odometer = tl.dayEnd[Math.max(0, day - 1)];
      }
      return {
        id: id('svc'),
        bikeId,
        date: toISODate(tl.dates[Math.max(0, day)]),
        odometer,
        itemIds: s.items.map(itemId),
        where: s.where,
        partsCost: s.parts,
        labourCost: s.labour,
        notes: s.notes,
      };
    });

    const docs: BikeDoc[] = spec.docs.map((d) => ({
      id: id('doc'),
      bikeId,
      type: d.type,
      number: d.number,
      issuedAt: toISODate(d.issued(today)),
      expiresAt: toISODate(d.expires(today)),
      cost: d.cost,
    }));

    data = {
      bikes: [...data.bikes, bike],
      schedule: [...data.schedule, ...schedule],
      services: [...data.services, ...services],
      fuel: [...data.fuel, ...fuel],
      rides: [...data.rides, ...rides],
      docs: [...data.docs, ...docs],
      readings: [...data.readings, ...readings],
    };
    data = reconcileBike(data, bikeId);
  });

  return data;
}
