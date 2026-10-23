import { useId, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { todayISO } from '@/lib/dates';
import { parseNumber } from '@/lib/format';
import type { ScheduleItem } from '@/lib/types';
import { useGarage } from '@/store/garage';
import { useBike } from '@/store/hooks';
import { describedBy, Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { createdToast } from '@/components/toasts';
import { FormFooter, numericProps, numStr } from './shared';

interface Props {
  bikeId: string;
  entry?: ScheduleItem;
  onDone(): void;
}

export function ItemForm({ bikeId, entry, onDone }: Props) {
  const uid = useId();
  const id = (s: string) => `${uid}-${s}`;
  const bike = useBike(bikeId);
  const addItem = useGarage((s) => s.addItem);
  const updateItem = useGarage((s) => s.updateItem);
  const [name, setName] = useState(entry?.name ?? '');
  const [km, setKm] = useState(numStr(entry?.intervalKm));
  const [months, setMonths] = useState(numStr(entry?.intervalMonths));
  const [lastKm, setLastKm] = useState(numStr(entry?.lastDoneKm ?? bike?.odometer));
  const [lastDate, setLastDate] = useState(entry?.lastDoneDate ?? todayISO());
  const [enabled, setEnabled] = useState(entry?.enabled ?? true);
  const [submitted, setSubmitted] = useState(false);

  const kmN = km.trim() === '' ? undefined : parseNumber(km);
  const monthsN = months.trim() === '' ? undefined : parseNumber(months);
  const lastKmN = parseNumber(lastKm);
  const errors = {
    name: name.trim() ? null : 'Name the item, e.g. "Fork oil".',
    interval:
      kmN === undefined && monthsN === undefined
        ? 'Set a km interval, a time interval, or both.'
        : (kmN !== undefined && !(kmN > 0)) || (monthsN !== undefined && !(monthsN > 0))
          ? 'Intervals must be above zero.'
          : null,
    lastKm: !(lastKmN >= 0)
      ? 'Enter the odometer when it was last done.'
      : bike && lastKmN > bike.odometer
        ? `Can't be above the current ${bike.odometer.toLocaleString('en-IN')} km.`
        : null,
    lastDate: lastDate > todayISO() ? "Can't be in the future." : null,
  };
  const show = (k: keyof typeof errors) => (submitted ? errors[k] : null);

  function submit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (Object.values(errors).some(Boolean)) return;
    const fields = { name: name.trim(), intervalKm: kmN, intervalMonths: monthsN, enabled };
    if (entry) {
      updateItem(entry.id, { ...fields, lastDoneKm: lastKmN, lastDoneDate: lastDate });
      toast.success(`${fields.name} updated`);
    } else {
      const saved = addItem({ ...fields, bikeId, baselineKm: lastKmN, baselineDate: lastDate });
      createdToast(`${fields.name} added to the schedule`, 'item', saved.id);
    }
    onDone();
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <Field label="Item" htmlFor={id('name')} error={show('name')}>
        <Input
          {...describedBy(id('name'), show('name'))}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Fork oil"
          autoFocus={!entry}
        />
      </Field>
      <fieldset aria-describedby={show('interval') ? id('interval-error') : id('interval-hint')}>
        <legend className="mb-1.5 text-sm font-medium text-muted">Every…</legend>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Kilometres" htmlFor={id('km')} aside="km">
            <Input
              {...numericProps}
              id={id('km')}
              value={km}
              onChange={(e) => setKm(e.target.value)}
              placeholder="—"
            />
          </Field>
          <Field label="Months" htmlFor={id('months')} aside="mo">
            <Input
              {...numericProps}
              id={id('months')}
              value={months}
              onChange={(e) => setMonths(e.target.value)}
              placeholder="—"
            />
          </Field>
        </div>
        {show('interval') ? (
          <p id={id('interval-error')} role="alert" className="mt-1.5 text-sm text-overdue">
            {errors.interval}
          </p>
        ) : (
          <p id={id('interval-hint')} className="mt-1.5 text-xs text-faint">
            Set both and it's due at whichever comes first.
          </p>
        )}
      </fieldset>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Last done at" htmlFor={id('lastkm')} error={show('lastKm')} aside="km">
          <Input
            {...numericProps}
            {...describedBy(id('lastkm'), show('lastKm'))}
            value={lastKm}
            onChange={(e) => setLastKm(e.target.value)}
          />
        </Field>
        <Field label="Last done on" htmlFor={id('lastdate')} error={show('lastDate')}>
          <Input
            type="date"
            {...describedBy(id('lastdate'), show('lastDate'))}
            value={lastDate}
            max={todayISO()}
            onChange={(e) => setLastDate(e.target.value)}
          />
        </Field>
      </div>
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-well px-4 py-2">
        <label htmlFor={id('enabled')} className="flex-1 cursor-pointer py-2">
          <span className="block text-sm font-semibold">Track this item</span>
          <span className="block text-xs text-faint">
            Disabled items don't count towards health
          </span>
        </label>
        <Switch id={id('enabled')} checked={enabled} onCheckedChange={setEnabled} />
      </div>
      <FormFooter label={entry ? 'Save changes' : 'Add item'} />
    </form>
  );
}
