import { useId, useMemo, useState, type FormEvent } from 'react';
import { ChevronDown } from 'lucide-react';
import { todayISO } from '@/lib/dates';
import { formatEconomy, pricePerLitre, readingFor } from '@/lib/fuel';
import { formatMoneyPrecise, parseNumber } from '@/lib/format';
import { validateOdometer } from '@/lib/odometer';
import type { FuelEntry } from '@/lib/types';
import { useGarage } from '@/store/garage';
import { useBike, useEconomyUnit } from '@/store/hooks';
import { describedBy, Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { createdToast } from '@/components/toasts';
import { decimalProps, FormFooter, numericProps, numStr, useOdoPoints } from './shared';
import { toast } from 'sonner';

interface Props {
  bikeId: string;
  entry?: FuelEntry;
  onDone(): void;
}

export function FuelForm({ bikeId, entry, onDone }: Props) {
  const uid = useId();
  const bike = useBike(bikeId);
  const unit = useEconomyUnit();
  const allFuel = useGarage((s) => s.fuel);
  const addFuel = useGarage((s) => s.addFuel);
  const updateFuel = useGarage((s) => s.updateFuel);
  const points = useOdoPoints(bikeId);

  const [odo, setOdo] = useState(numStr(entry?.odometer ?? bike?.odometer));
  const [litres, setLitres] = useState(numStr(entry?.litres));
  const [amount, setAmount] = useState(numStr(entry?.amount));
  const [fullTank, setFullTank] = useState(entry?.fullTank ?? true);
  const [date, setDate] = useState(entry?.date ?? todayISO());
  const [station, setStation] = useState(entry?.station ?? '');
  const [more, setMore] = useState(Boolean(entry));
  const [submitted, setSubmitted] = useState(false);

  const km = parseNumber(odo);
  const l = parseNumber(litres);
  const amt = parseNumber(amount);

  const errors = {
    odo: validateOdometer(points, date, km, entry?.id),
    litres: !(l > 0)
      ? 'Enter litres filled.'
      : l > 60
        ? "That's more than any bike tank holds."
        : null,
    amount: !(amt > 0) ? 'Enter the amount paid.' : null,
    date: date > todayISO() ? "Can't log a fill-up in the future." : null,
  };
  const valid = !Object.values(errors).some(Boolean);
  const show = (k: keyof typeof errors) =>
    submitted || (k === 'odo' && odo !== '') ? errors[k] : null;

  const bikeFuel = useMemo(
    () => allFuel.filter((f) => f.bikeId === bikeId && f.id !== entry?.id),
    [allFuel, bikeId, entry?.id],
  );
  const preview =
    km > 0 && l > 0 && fullTank
      ? readingFor(
          [
            ...bikeFuel,
            { id: '__draft', bikeId, date, odometer: km, litres: l, amount: amt || 0, fullTank },
          ],
          '__draft',
        )
      : undefined;

  const stations = useMemo(
    () => [
      ...new Set(
        allFuel.filter((f) => f.bikeId === bikeId && f.station).map((f) => f.station as string),
      ),
    ],
    [allFuel, bikeId],
  );

  function submit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (!valid) return;
    const record = {
      bikeId,
      date,
      odometer: km,
      litres: l,
      amount: amt,
      fullTank,
      station: station.trim() || undefined,
    };
    if (entry) {
      updateFuel(entry.id, record);
      toast.success('Fill-up updated');
    } else {
      const saved = addFuel(record);
      const reading = readingFor(
        useGarage.getState().fuel.filter((f) => f.bikeId === bikeId),
        saved.id,
      );
      createdToast(
        reading ? formatEconomy(reading.kmpl, unit) : 'Fill-up logged',
        'fuel',
        saved.id,
        reading
          ? `${reading.distance.toLocaleString('en-IN')} km on ${reading.litres.toFixed(2)} l · ${formatMoneyPrecise(pricePerLitre(record))}/l`
          : fullTank
            ? 'First full tank — economy shows from the next one.'
            : 'Partial fill — economy updates on your next full tank.',
      );
    }
    onDone();
  }

  const id = (s: string) => `${uid}-${s}`;
  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <Field
        label="Odometer"
        htmlFor={id('odo')}
        error={show('odo')}
        hint={bike ? `Last: ${bike.odometer.toLocaleString('en-IN')} km` : undefined}
        aside="km"
      >
        <Input
          {...numericProps}
          {...describedBy(id('odo'), show('odo'), bike)}
          value={odo}
          onChange={(e) => setOdo(e.target.value)}
          className="font-display text-2xl font-semibold"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Litres" htmlFor={id('litres')} error={show('litres')} aside="l">
          <Input
            {...decimalProps}
            {...describedBy(id('litres'), show('litres'))}
            placeholder="0.00"
            value={litres}
            onChange={(e) => setLitres(e.target.value)}
            autoFocus={!entry}
            className="font-display text-2xl font-semibold"
          />
        </Field>
        <Field label="Amount" htmlFor={id('amount')} error={show('amount')} aside="₹">
          <Input
            {...decimalProps}
            {...describedBy(id('amount'), show('amount'))}
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="font-display text-2xl font-semibold"
          />
        </Field>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-well px-4 py-2">
        <label htmlFor={id('full')} className="flex-1 cursor-pointer py-2">
          <span className="block text-sm font-semibold">Full tank</span>
          <span className="block text-xs text-faint">Filled to the brim — needed for economy</span>
        </label>
        <Switch id={id('full')} checked={fullTank} onCheckedChange={setFullTank} />
      </div>

      <div
        aria-live="polite"
        className="num flex min-h-6 flex-wrap gap-x-4 gap-y-1 text-sm text-muted"
      >
        {l > 0 && amt > 0 && <span>{formatMoneyPrecise(amt / l)}/l</span>}
        {preview && (
          <span>
            ≈ <strong className="text-fg">{formatEconomy(preview.kmpl, unit)}</strong> over{' '}
            {preview.distance.toLocaleString('en-IN')} km
          </span>
        )}
      </div>

      {!more ? (
        <button
          type="button"
          onClick={() => setMore(true)}
          className="inline-flex min-h-11 cursor-pointer items-center gap-1 self-start text-sm font-medium text-accent-ink"
        >
          Date & station <ChevronDown className="size-4" />
        </button>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Date" htmlFor={id('date')} error={show('date')}>
            <Input
              type="date"
              {...describedBy(id('date'), show('date'))}
              value={date}
              max={todayISO()}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
          <Field label="Fuel station (optional)" htmlFor={id('station')}>
            <Input
              id={id('station')}
              list={id('stations')}
              value={station}
              onChange={(e) => setStation(e.target.value)}
              placeholder="Shell, Indiranagar"
              autoComplete="off"
            />
            <datalist id={id('stations')}>
              {stations.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </Field>
        </div>
      )}

      <FormFooter label={entry ? 'Save changes' : 'Log fill-up'} />
    </form>
  );
}
