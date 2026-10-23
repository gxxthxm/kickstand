import { useId, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { todayISO } from '@/lib/dates';
import { parseNumber } from '@/lib/format';
import { validateOdometer } from '@/lib/odometer';
import type { OdoReading } from '@/lib/types';
import { useGarage } from '@/store/garage';
import { useBike } from '@/store/hooks';
import { describedBy, Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { createdToast } from '@/components/toasts';
import { FormFooter, numericProps, numStr, useOdoPoints } from './shared';

interface Props {
  bikeId: string;
  entry?: OdoReading;
  onDone(): void;
}

export function OdometerForm({ bikeId, entry, onDone }: Props) {
  const uid = useId();
  const id = (s: string) => `${uid}-${s}`;
  const bike = useBike(bikeId);
  const addReading = useGarage((s) => s.addReading);
  const updateReading = useGarage((s) => s.updateReading);
  const points = useOdoPoints(bikeId);
  const [odo, setOdo] = useState(numStr(entry?.odometer));
  const [date, setDate] = useState(entry?.date ?? todayISO());
  const [submitted, setSubmitted] = useState(false);

  const km = parseNumber(odo);
  const error = odo === '' && !submitted ? null : validateOdometer(points, date, km, entry?.id);
  const dateError = date > todayISO() ? "Can't be in the future." : null;

  function submit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (validateOdometer(points, date, km, entry?.id) || dateError) return;
    if (entry) {
      updateReading(entry.id, { odometer: km, date });
      toast.success('Reading updated');
    } else {
      const before = bike?.odometer ?? 0;
      const saved = addReading({ bikeId, odometer: km, date });
      createdToast(
        'Odometer updated',
        'reading',
        saved.id,
        km > before ? `+${(km - before).toLocaleString('en-IN')} km since last log` : undefined,
      );
    }
    onDone();
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <Field
        label="Odometer reading"
        htmlFor={id('odo')}
        error={error}
        hint={bike ? `Current: ${bike.odometer.toLocaleString('en-IN')} km` : undefined}
        aside="km"
      >
        <Input
          {...numericProps}
          {...describedBy(id('odo'), error, bike)}
          value={odo}
          onChange={(e) => setOdo(e.target.value)}
          placeholder={bike ? String(bike.odometer) : '0'}
          autoFocus
          className="font-display text-3xl font-semibold"
        />
      </Field>
      <Field label="Date" htmlFor={id('date')} error={dateError}>
        <Input
          type="date"
          {...describedBy(id('date'), dateError)}
          value={date}
          max={todayISO()}
          onChange={(e) => setDate(e.target.value)}
        />
      </Field>
      <p className="text-sm text-muted">Due items recalculate as soon as you save.</p>
      <FormFooter label={entry ? 'Save changes' : 'Update odometer'} />
    </form>
  );
}
