import { useId, useMemo, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { todayISO } from '@/lib/dates';
import { itemStatus } from '@/lib/due';
import { formatMoney, parseNumber } from '@/lib/format';
import { validateOdometer } from '@/lib/odometer';
import type { ServiceEntry } from '@/lib/types';
import { useGarage } from '@/store/garage';
import { useBike } from '@/store/hooks';
import { describedBy, Field } from '@/components/ui/field';
import { Input, Textarea } from '@/components/ui/input';
import { Chip, Segmented } from '@/components/ui/segmented';
import { StatusIcon } from '@/components/StatusBadge';
import { createdToast } from '@/components/toasts';
import { decimalProps, FormFooter, numericProps, numStr, useOdoPoints } from './shared';

interface Props {
  bikeId: string;
  entry?: ServiceEntry;
  onDone(): void;
}

export function ServiceForm({ bikeId, entry, onDone }: Props) {
  const uid = useId();
  const id = (s: string) => `${uid}-${s}`;
  const bike = useBike(bikeId);
  const schedule = useGarage((s) => s.schedule);
  const services = useGarage((s) => s.services);
  const addService = useGarage((s) => s.addService);
  const updateService = useGarage((s) => s.updateService);
  const points = useOdoPoints(bikeId);
  const today = todayISO();

  const items = useMemo(() => {
    const odo = bike?.odometer ?? 0;
    return schedule
      .filter((i) => i.bikeId === bikeId && (i.enabled || entry?.itemIds.includes(i.id)))
      .map((item) => ({
        item,
        status: itemStatus(item, odo, today).status,
        remaining: itemStatus(item, odo, today).remaining,
      }))
      .sort((a, b) => a.remaining - b.remaining);
  }, [schedule, bikeId, bike?.odometer, today, entry]);

  const workshops = useMemo(
    () => [...new Set(services.filter((s) => s.where !== 'DIY').map((s) => s.where))],
    [services],
  );
  const lastWorkshop = useMemo(
    () =>
      [...services]
        .filter((s) => s.bikeId === bikeId && s.where !== 'DIY')
        .sort((a, b) => (a.date < b.date ? 1 : -1))[0]?.where,
    [services, bikeId],
  );

  const [date, setDate] = useState(entry?.date ?? today);
  const [odo, setOdo] = useState(numStr(entry?.odometer ?? bike?.odometer));
  // Pre-select whatever is due, so a routine service is two taps.
  const [selected, setSelected] = useState<string[]>(
    entry?.itemIds ?? items.filter((i) => i.status !== 'OK').map((i) => i.item.id),
  );
  const [kind, setKind] = useState<'DIY' | 'Workshop'>(
    entry ? (entry.where === 'DIY' ? 'DIY' : 'Workshop') : 'Workshop',
  );
  const [workshop, setWorkshop] = useState(
    entry && entry.where !== 'DIY' ? entry.where : (lastWorkshop ?? ''),
  );
  const [parts, setParts] = useState(numStr(entry?.partsCost));
  const [labour, setLabour] = useState(numStr(entry?.labourCost));
  const [notes, setNotes] = useState(entry?.notes ?? '');
  const [submitted, setSubmitted] = useState(false);

  const km = parseNumber(odo);
  const partsN = parts.trim() === '' ? 0 : parseNumber(parts);
  const labourN = kind === 'DIY' || labour.trim() === '' ? 0 : parseNumber(labour);

  const errors = {
    odo: validateOdometer(points, date, km, entry?.id),
    items:
      selected.length === 0 && !notes.trim()
        ? 'Pick at least one item, or describe the work in notes.'
        : null,
    workshop: kind === 'Workshop' && !workshop.trim() ? 'Which workshop?' : null,
    parts: Number.isNaN(partsN) || partsN < 0 ? 'Enter a cost, or leave blank.' : null,
    labour: Number.isNaN(labourN) || labourN < 0 ? 'Enter a cost, or leave blank.' : null,
    date: date > today ? "Can't log a service in the future." : null,
  };
  const valid = !Object.values(errors).some(Boolean);
  const show = (k: keyof typeof errors) =>
    submitted || (k === 'odo' && odo !== '') ? errors[k] : null;

  function submit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (!valid) return;
    const record = {
      bikeId,
      date,
      odometer: km,
      itemIds: selected,
      where: kind === 'DIY' ? 'DIY' : workshop.trim(),
      partsCost: partsN,
      labourCost: labourN,
      notes: notes.trim() || undefined,
    };
    if (entry) {
      updateService(entry.id, record);
      toast.success('Service updated');
    } else {
      const saved = addService(record);
      createdToast(
        `Service logged · ${selected.length} item${selected.length === 1 ? '' : 's'} reset`,
        'service',
        saved.id,
        partsN + labourN > 0 ? `${formatMoney(partsN + labourN)} at ${record.where}` : undefined,
      );
    }
    onDone();
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <fieldset aria-describedby={show('items') ? id('items-error') : undefined}>
        <legend className="mb-2 text-sm font-medium text-muted">What was done</legend>
        <div className="flex flex-wrap gap-2">
          {items.map(({ item, status }) => (
            <Chip
              key={item.id}
              pressed={selected.includes(item.id)}
              onPressedChange={(p) =>
                setSelected((cur) => (p ? [...cur, item.id] : cur.filter((x) => x !== item.id)))
              }
            >
              {status !== 'OK' && <StatusIcon status={status} />}
              {item.name}
              {status !== 'OK' && (
                <span className="sr-only">({status === 'Overdue' ? 'overdue' : 'due soon'})</span>
              )}
            </Chip>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-faint">No schedule items for this bike yet.</p>
          )}
        </div>
        {show('items') && (
          <p id={id('items-error')} role="alert" className="mt-2 text-sm text-overdue">
            {errors.items}
          </p>
        )}
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Date" htmlFor={id('date')} error={show('date')}>
          <Input
            type="date"
            {...describedBy(id('date'), show('date'))}
            value={date}
            max={today}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>
        <Field label="Odometer" htmlFor={id('odo')} error={show('odo')} aside="km">
          <Input
            {...numericProps}
            {...describedBy(id('odo'), show('odo'))}
            value={odo}
            onChange={(e) => setOdo(e.target.value)}
            className="font-display text-xl font-semibold"
          />
        </Field>
      </div>

      <Segmented<'DIY' | 'Workshop'>
        label="Who did the work"
        value={kind}
        onValueChange={setKind}
        options={[
          { value: 'Workshop', label: 'Workshop' },
          { value: 'DIY', label: 'DIY' },
        ]}
      />
      {kind === 'Workshop' && (
        <Field label="Workshop" htmlFor={id('workshop')} error={show('workshop')}>
          <Input
            {...describedBy(id('workshop'), show('workshop'))}
            list={id('workshops')}
            value={workshop}
            onChange={(e) => setWorkshop(e.target.value)}
            placeholder="Speed Bikes, Indiranagar"
            autoComplete="off"
          />
          <datalist id={id('workshops')}>
            {workshops.map((w) => (
              <option key={w} value={w} />
            ))}
          </datalist>
        </Field>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Parts" htmlFor={id('parts')} error={show('parts')} aside="₹">
          <Input
            {...decimalProps}
            {...describedBy(id('parts'), show('parts'))}
            value={parts}
            onChange={(e) => setParts(e.target.value)}
            placeholder="0"
          />
        </Field>
        {kind === 'Workshop' && (
          <Field label="Labour" htmlFor={id('labour')} error={show('labour')} aside="₹">
            <Input
              {...decimalProps}
              {...describedBy(id('labour'), show('labour'))}
              value={labour}
              onChange={(e) => setLabour(e.target.value)}
              placeholder="0"
            />
          </Field>
        )}
      </div>
      <Field label="Notes (optional)" htmlFor={id('notes')}>
        <Textarea
          id={id('notes')}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Oil brand, parts replaced, what the mechanic said"
        />
      </Field>
      <FormFooter label={entry ? 'Save changes' : 'Log service'} />
    </form>
  );
}
