import { useId, useState, type FormEvent } from 'react';
import { Star } from 'lucide-react';
import { toast } from 'sonner';
import { todayISO } from '@/lib/dates';
import { parseNumber } from '@/lib/format';
import { validateOdometer } from '@/lib/odometer';
import { RIDE_TAGS, type Ride } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useGarage } from '@/store/garage';
import { useBike } from '@/store/hooks';
import { describedBy, Field } from '@/components/ui/field';
import { Input, Textarea } from '@/components/ui/input';
import { Chip, Segmented } from '@/components/ui/segmented';
import { createdToast } from '@/components/toasts';
import { FormFooter, numericProps, numStr, useOdoPoints } from './shared';

interface Props {
  bikeId: string;
  entry?: Ride;
  onDone(): void;
}

type Rating = NonNullable<Ride['rating']>;

export function RideForm({ bikeId, entry, onDone }: Props) {
  const uid = useId();
  const id = (s: string) => `${uid}-${s}`;
  const bike = useBike(bikeId);
  const addRide = useGarage((s) => s.addRide);
  const updateRide = useGarage((s) => s.updateRide);
  const points = useOdoPoints(bikeId);

  const [title, setTitle] = useState(entry?.title ?? '');
  const [date, setDate] = useState(entry?.date ?? todayISO());
  const [start, setStart] = useState(numStr(entry?.startKm ?? bike?.odometer));
  const [mode, setMode] = useState<'distance' | 'end'>('distance');
  const [distance, setDistance] = useState(entry ? numStr(entry.endKm - entry.startKm) : '');
  const [end, setEnd] = useState(numStr(entry?.endKm));
  const [tags, setTags] = useState<string[]>(entry?.tags ?? []);
  const [rating, setRating] = useState<Rating | undefined>(entry?.rating);
  const [notes, setNotes] = useState(entry?.notes ?? '');
  const [submitted, setSubmitted] = useState(false);

  const startKm = parseNumber(start);
  const endKm = mode === 'distance' ? startKm + parseNumber(distance) : parseNumber(end);
  const dist = endKm - startKm;

  const errors = {
    title: title.trim() ? null : 'Give the ride a name.',
    start: validateOdometer(points, date, startKm, entry?.id),
    end: !(dist > 0)
      ? mode === 'distance'
        ? 'Enter how far you rode.'
        : 'End must be higher than start.'
      : validateOdometer(points, date, endKm, entry?.id),
    date: date > todayISO() ? "Can't log a ride in the future." : null,
  };
  const valid = !Object.values(errors).some(Boolean);
  const show = (k: keyof typeof errors) => (submitted ? errors[k] : null);

  function submit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (!valid) return;
    const record = {
      bikeId,
      date,
      title: title.trim(),
      startKm,
      endKm,
      tags,
      rating,
      notes: notes.trim() || undefined,
    };
    if (entry) {
      updateRide(entry.id, record);
      toast.success('Ride updated');
    } else {
      const saved = addRide(record);
      createdToast(
        `${dist.toLocaleString('en-IN')} km logged`,
        'ride',
        saved.id,
        `Odometer now ${endKm.toLocaleString('en-IN')} km`,
      );
    }
    onDone();
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <Field label="Title" htmlFor={id('title')} error={show('title')}>
        <Input
          {...describedBy(id('title'), show('title'))}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nandi Hills sunrise"
          autoFocus={!entry}
          enterKeyHint="next"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date" htmlFor={id('date')} error={show('date')}>
          <Input
            type="date"
            {...describedBy(id('date'), show('date'))}
            value={date}
            max={todayISO()}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>
        <Field label="Start" htmlFor={id('start')} error={show('start')} aside="km">
          <Input
            {...numericProps}
            {...describedBy(id('start'), show('start'))}
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="font-display text-xl font-semibold"
          />
        </Field>
      </div>
      <Segmented
        label="Enter distance or end odometer"
        value={mode}
        onValueChange={(m) => {
          if (m === 'end' && dist > 0) setEnd(String(endKm));
          if (m === 'distance' && dist > 0) setDistance(String(dist));
          setMode(m);
        }}
        options={[
          { value: 'distance', label: 'Distance' },
          { value: 'end', label: 'End odometer' },
        ]}
      />
      {mode === 'distance' ? (
        <Field
          label="Distance"
          htmlFor={id('end')}
          error={show('end')}
          aside={dist > 0 ? `ends at ${endKm.toLocaleString('en-IN')} km` : 'km'}
        >
          <Input
            {...numericProps}
            {...describedBy(id('end'), show('end'))}
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            placeholder="0"
            className="font-display text-2xl font-semibold"
          />
        </Field>
      ) : (
        <Field
          label="End odometer"
          htmlFor={id('end')}
          error={show('end')}
          aside={dist > 0 ? `${dist.toLocaleString('en-IN')} km ride` : 'km'}
        >
          <Input
            {...numericProps}
            {...describedBy(id('end'), show('end'))}
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="font-display text-2xl font-semibold"
          />
        </Field>
      )}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-sm font-medium text-muted">Tags</legend>
        <div className="flex flex-wrap gap-2">
          {RIDE_TAGS.map((t) => (
            <Chip
              key={t}
              pressed={tags.includes(t)}
              onPressedChange={(p) =>
                setTags((cur) => (p ? [...cur, t] : cur.filter((x) => x !== t)))
              }
            >
              {t}
            </Chip>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-muted">Rating</legend>
        <div className="flex" role="radiogroup" aria-label="Rating">
          {([1, 2, 3, 4, 5] as Rating[]).map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
              onClick={() => setRating(rating === n ? undefined : n)}
              className="grid grid-cols-1 size-11 cursor-pointer place-items-center rounded-full hover:bg-well"
            >
              <Star
                className={cn(
                  'size-6',
                  rating && n <= rating ? 'fill-soon text-soon' : 'text-line-strong',
                )}
              />
            </button>
          ))}
        </div>
      </fieldset>

      <Field label="Notes (optional)" htmlFor={id('notes')}>
        <Textarea
          id={id('notes')}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Route, weather, how the bike felt"
        />
      </Field>

      <FormFooter label={entry ? 'Save changes' : 'Log ride'} />
    </form>
  );
}
