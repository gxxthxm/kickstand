# Kickstand

A digital garage for motorcycle owners. Kickstand tracks every bike's service schedule, fuel economy, expenses, rides and papers, and tells you what needs attention before it becomes a problem.

It's a frontend-only demo: no backend, no accounts, no API calls. Data lives in `localStorage`, and the app installs as a PWA that works offline in a parking lot.

**The core idea:** everything runs off the odometer. Logging a fill-up or a ride updates the odometer, which recalculates what's due. Maintenance tracking happens as a side effect of things riders already do.

```
log a fill-up or ride → odometer updates → "Needs attention" recalculates → log the service → costs and history build up
```

## Features

| Screen                                                | What it does                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Logbook** (`/logbook`)                              | Every fill-up, ride, service and odometer reading across all bikes, grouped by month with spend per month. Filter by type and by bike; tap any log to edit it.                                                                                                                                                                                                                                                                                                                                                          |
| **Garage** (`/`)                                      | Bike cards tinted with each bike's colour: rolling odometer, health gauge, the most urgent item and quick actions (+Fuel, +Ride, +Service, Odo). A combined **Needs attention** list across bikes, sorted overdue → due soon, including expiring papers, with one-tap **Done** / **Renew**.                                                                                                                                                                                                                             |
| **Quick log** (`/log`)                                | Bottom sheet with Fuel / Ride / Service / Odometer and a bike picker. The odometer is pre-filled. A fill-up is 3 fields, and the toast shows the computed km/l with Undo. Services pre-select whatever is due.                                                                                                                                                                                                                                                                                                          |
| **Bike detail** (`/bikes/:id/:tab`)                   | Header with odometer and health, plus six tabs: **Overview** (next 3 due, stats, papers, recent activity), **Service** (schedule as fuel-gauge bars, Mark done now, add/edit/disable items, filterable history timeline), **Fuel** (km/l chart with dashed average, best/latest, price-per-litre trend, mileage-drop alert, fill-up list), **Rides** (total km, tag filter, ratings), **Docs** (Expired / Expiring in 30 days / Valid) and **Costs** (breakdown, cost per km, total cost of ownership, 12-month chart). |
| **Add / edit bike** (`/bikes/new`, `/bikes/:id/edit`) | Make, model, year, nickname, colour, purchase date and price, odometer, and a schedule template picker (Adventure, Naked/Sport, Scooter) with "last full service at".                                                                                                                                                                                                                                                                                                                                                   |
| **Costs** (`/costs`)                                  | All-bike totals, cost per km, a 12-month stacked bar chart by category and a per-bike comparison.                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Navigation**                                        | Bottom bar on phones (Garage, Logbook, **+**, Costs, Settings) with the quick-log **+** in the centre; left sidebar from 768 px.                                                                                                                                                                                                                                                                                                                                                                                        |
| **Settings** (`/settings`)                            | km/l or l/100km, ₹ currency, dark/light theme, Export JSON, Reset demo data, Clear all data.                                                                                                                                                                                                                                                                                                                                                                                                                            |

Every log can be edited or deleted, and every delete has an Undo toast. Anything that becomes more urgent after a log pulses once.

### Demo data

On first run (and on **Reset demo data**), `src/data/seed.ts` generates a garage with every date relative to today:

- **Dusty**, Royal Enfield Himalayan 450, 8,400 km (~30 km/l)
- **Orange Crush**, KTM 390 Duke, 21,700 km (~28 km/l). Its latest tank drops ~21%, which triggers the mileage alert.
- **Errand Runner**, Honda Activa 6G, 14,200 km (~48 km/l). Its coolant item is disabled because the scooter is air-cooled.

The seed simulates a year of riding per bike. Daily commutes and named rides (a Coorg weekend, a Nandi Hills sunrise ride, a track day) build an odometer timeline. A tank model then produces 92 full and partial fill-ups along it, and 12 services sit at fixed odometer points. So every log is consistent, and the garage always opens in the same state: **1 overdue** (KTM chain adjust, 120 km past), **3 due soon**, one **PUC expiring in 9 days**, everything else OK.

## The rules

All logic is pure functions in `src/lib`, unit-tested with Vitest.

### Service due status (`lib/due.ts`)

```
kmLeft   = lastDoneKm + intervalKm − odometer
daysLeft = (lastDoneDate + intervalMonths) − today
```

- **Overdue** if either is below 0.
- **Due soon** if `kmLeft ≤ 10% of intervalKm` or `daysLeft ≤ 14`.
- Otherwise **OK**. Items with only a km interval or only a time interval use just that limit.
- **Progress** is the larger of `km used / intervalKm` and `days used / interval days`, capped at 100%.
- **Bike health** is the share of enabled items that are OK.

`lastDoneKm` / `lastDoneDate` are derived. Each is the latest of the item's baseline (set when the bike or item is created or edited) and every logged service that included the item. Deleting a service rolls its items back, and undo restores them.

### Fuel economy, full-to-full (`lib/fuel.ts`)

For each full-tank entry after the first:

```
economy = km since the previous full tank ÷ litres of every fill after that previous full tank, up to and including this one
```

Partial fills add litres but don't produce a reading. Fills before the first full tank are ignored, because the starting level is unknown. The **average** is distance-weighted (total km ÷ total litres across readings). The **mileage alert** fires when the latest reading is 15% or more worse than the average.

### Odometer validation (`lib/odometer.ts`)

A new log's odometer can't be lower than the bike's current odometer. If it's back-dated, it has to fit between the readings on either side of that date. The bike's odometer is always the max of all its logs: fill-ups, services, both ends of each ride, and plain readings.

### Costs (`lib/costs.ts`)

Per-bike totals split into fuel, service (labour), parts and documents. Cost per km is the total divided by the km covered since the first log. Monthly totals cover the last 12 months, and document costs are dated by their issue date.

## Stack

Vite + React + TypeScript (strict, no `any`) · Tailwind CSS v4 · shadcn/ui-style components on Radix · React Router (`HashRouter`) · Zustand with `persist` (key `kickstand.v1`) · Recharts · date-fns · Framer Motion · lucide-react · vite-plugin-pwa · Vitest · ESLint + Prettier.

Fonts are self-hosted with Fontsource (Geist for UI and headings, Geist Mono for the odometer), so the app has no network dependency. The palette is zinc neutrals with an electric-lime accent (borrowed from the Lime app inspiration). Status colours are kept clear of it: amber leans orange and OK leans emerald.

```
src/
  components/   UI kit (ui/), forms, charts, cards, gauges, odometer, nav
  routes/       Garage, QuickLog, Logbook, BikeDetail + bike/ tabs, BikeFormPage, Costs, Settings
  store/        Zustand store (persisted), UI store, hooks
  lib/          types and pure logic: due, fuel, odometer, reconcile, costs, garage views
  data/         templates.json (schedule templates), seed.ts (demo generator)
```

## Run it

Requires Node 20.19+.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # Vitest: due status, fuel economy, odometer, costs, seed states
npm run lint
npm run build      # type-check + production build to dist/ (works from any subpath)
npm run size       # fails if JS + CSS exceed 450 KB gzipped
npm run icons      # regenerate PWA PNG icons from the gauge mark
```

## Quality bar

- Works at 375 px with no horizontal scroll, up to wide desktop (sidebar from 768 px).
- Lighthouse accessibility 100 and best practices 100 on every screen tested. Tap targets are 44 px or larger, status always pairs an icon with a label, charts have text summaries, focus is visible, and reduced motion is respected.
- JS + CSS ≈ 340 KB gzipped (budget 450 KB). Recharts loads only on chart screens.

## Deploying

The build is static and uses relative paths (`base: './'`) with hash routing, so `dist/` runs from any static host or subpath. The included GitHub Actions workflow publishes to GitHub Pages on every push to `main`. In the repo settings, set **Pages → Source** to **GitHub Actions** once.
