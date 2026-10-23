import { useId, useState, type FormEvent } from 'react';
import { Check, ChevronLeft, Trash2 } from 'lucide-react';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { todayISO } from '@/lib/dates';
import { parseNumber } from '@/lib/format';
import { describeInterval, TEMPLATES } from '@/lib/templates';
import { cn } from '@/lib/utils';
import { useGarage } from '@/store/garage';
import { useBike } from '@/store/hooks';
import { Page, PageHeader } from '@/components/PageHeader';
import { undoToast } from '@/components/toasts';
import { ConfirmDialog } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { describedBy, Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { decimalProps, numericProps, numStr } from '@/components/forms/shared';
import { toast } from 'sonner';

const COLOURS = [
  { hex: '#F26B1D', name: 'Orange' },
  { hex: '#D93A3A', name: 'Red' },
  { hex: '#C08A4E', name: 'Sand' },
  { hex: '#E8C547', name: 'Yellow' },
  { hex: '#3FAF6B', name: 'Green' },
  { hex: '#3E7FD6', name: 'Blue' },
  { hex: '#8A63D2', name: 'Purple' },
  { hex: '#9AA0A8', name: 'Silver' },
  { hex: '#2B2E33', name: 'Black' },
];

export default function BikeFormPage() {
  const { id } = useParams();
  const bike = useBike(id);
  if (id && !bike) return <Navigate to="/" replace />;
  return <BikeForm key={id ?? 'new'} />;
}

function BikeForm() {
  const { id } = useParams();
  const bike = useBike(id);
  const editing = Boolean(bike);
  const navigate = useNavigate();
  const uid = useId();
  const f = (s: string) => `${uid}-${s}`;
  const addBike = useGarage((s) => s.addBike);
  const updateBike = useGarage((s) => s.updateBike);
  const remove = useGarage((s) => s.remove);
  const thisYear = new Date().getFullYear();

  const [nickname, setNickname] = useState(bike?.nickname ?? '');
  const [make, setMake] = useState(bike?.make ?? '');
  const [model, setModel] = useState(bike?.model ?? '');
  const [year, setYear] = useState(numStr(bike?.year ?? thisYear));
  const [colour, setColour] = useState(bike?.colour ?? COLOURS[0].hex);
  const [purchaseDate, setPurchaseDate] = useState(bike?.purchaseDate ?? todayISO());
  const [price, setPrice] = useState(numStr(bike?.purchasePrice));
  const [odo, setOdo] = useState(numStr(bike?.odometer));
  const [template, setTemplate] = useState(TEMPLATES[0].id);
  const [lastKm, setLastKm] = useState('');
  const [lastDate, setLastDate] = useState(todayISO());
  const [submitted, setSubmitted] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const yearN = parseNumber(year);
  const odoN = parseNumber(odo);
  const priceN = price.trim() === '' ? undefined : parseNumber(price);
  const lastKmN = lastKm.trim() === '' ? odoN : parseNumber(lastKm);

  const errors = {
    nickname: nickname.trim() ? null : 'Give it a name — "Blue Thunder", "Daily", anything.',
    make: make.trim() ? null : 'Enter the make.',
    model: model.trim() ? null : 'Enter the model.',
    year:
      Number.isInteger(yearN) && yearN >= 1950 && yearN <= thisYear + 1
        ? null
        : `Enter a year between 1950 and ${thisYear + 1}.`,
    odo: editing ? null : odoN >= 0 ? null : 'Enter the current odometer in km.',
    price:
      priceN !== undefined && (Number.isNaN(priceN) || priceN < 0)
        ? 'Enter a price, or leave blank.'
        : null,
    purchaseDate: !purchaseDate
      ? 'Pick a date.'
      : purchaseDate > todayISO()
        ? "Can't be in the future."
        : null,
    lastKm:
      editing || lastKm.trim() === ''
        ? null
        : !(lastKmN >= 0)
          ? 'Enter a km reading.'
          : lastKmN > odoN
            ? 'Must be at or below the current odometer.'
            : null,
    lastDate: editing ? null : lastDate > todayISO() ? "Can't be in the future." : null,
  };
  const valid = !Object.values(errors).some(Boolean);
  const show = (k: keyof typeof errors) => (submitted ? errors[k] : null);

  function submit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (!valid) {
      requestAnimationFrame(() =>
        document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
      );
      return;
    }
    const fields = {
      nickname: nickname.trim(),
      make: make.trim(),
      model: model.trim(),
      year: yearN,
      colour,
      purchaseDate,
      purchasePrice: priceN,
    };
    if (bike) {
      updateBike(bike.id, fields);
      toast.success(`${fields.nickname} updated`);
      navigate(`/bikes/${bike.id}`);
    } else {
      const newId = addBike({
        ...fields,
        odometer: odoN,
        templateId: template,
        lastServiceKm: lastKmN,
        lastServiceDate: lastDate,
      });
      toast.success(`${fields.nickname} is in the garage`, {
        description: 'Log a fill-up or ride to keep the odometer current.',
      });
      navigate(`/bikes/${newId}`);
    }
  }

  const selectedTemplate = TEMPLATES.find((t) => t.id === template);

  return (
    <Page className="max-w-3xl">
      <Link
        to={bike ? `/bikes/${bike.id}` : '/'}
        className="-ml-2 mt-3 inline-flex min-h-11 items-center gap-1 pr-3 pl-1 text-sm font-semibold text-muted hover:text-fg md:mt-6"
      >
        <ChevronLeft className="size-5" /> {bike ? bike.nickname : 'Garage'}
      </Link>
      <PageHeader title={bike ? 'Edit bike' : 'Add a bike'} className="pt-1 md:pt-2" />

      <form onSubmit={submit} noValidate className="flex flex-col gap-6">
        <Card className="flex flex-col gap-4 p-4 sm:p-5">
          <Field label="Nickname" htmlFor={f('nick')} error={show('nickname')}>
            <Input
              {...describedBy(f('nick'), show('nickname'))}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Blue Thunder"
              autoComplete="off"
              className="font-display text-2xl font-semibold"
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr_7rem]">
            <Field label="Make" htmlFor={f('make')} error={show('make')}>
              <Input
                {...describedBy(f('make'), show('make'))}
                value={make}
                onChange={(e) => setMake(e.target.value)}
                placeholder="Royal Enfield"
                autoComplete="off"
              />
            </Field>
            <Field label="Model" htmlFor={f('model')} error={show('model')}>
              <Input
                {...describedBy(f('model'), show('model'))}
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Classic 350"
                autoComplete="off"
              />
            </Field>
            <Field label="Year" htmlFor={f('year')} error={show('year')}>
              <Input
                {...numericProps}
                {...describedBy(f('year'), show('year'))}
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </Field>
          </div>
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-muted">Colour</legend>
            <div role="radiogroup" aria-label="Colour" className="flex flex-wrap gap-1">
              {COLOURS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  role="radio"
                  aria-checked={colour.toLowerCase() === c.hex.toLowerCase()}
                  aria-label={c.name}
                  onClick={() => setColour(c.hex)}
                  className="grid grid-cols-1 size-11 cursor-pointer place-items-center rounded-full"
                >
                  <span
                    className={cn(
                      'grid size-8 place-items-center rounded-full ring-2 ring-offset-2 ring-offset-card',
                      colour.toLowerCase() === c.hex.toLowerCase() ? 'ring-fg' : 'ring-transparent',
                    )}
                    style={{ background: c.hex }}
                  >
                    {colour.toLowerCase() === c.hex.toLowerCase() && (
                      <Check aria-hidden className="size-4 text-white mix-blend-difference" />
                    )}
                  </span>
                </button>
              ))}
              <label
                className="relative grid grid-cols-1 size-11 cursor-pointer place-items-center rounded-full"
                title="Custom colour"
              >
                <span className="sr-only">Custom colour</span>
                <span
                  className="size-8 rounded-full border-2 border-dashed border-line-strong"
                  style={{
                    background: COLOURS.some((c) => c.hex.toLowerCase() === colour.toLowerCase())
                      ? undefined
                      : colour,
                  }}
                />
                <input
                  type="color"
                  value={colour}
                  onChange={(e) => setColour(e.target.value)}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </label>
            </div>
          </fieldset>
        </Card>

        <Card className="flex flex-col gap-4 p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Purchase date" htmlFor={f('pdate')} error={show('purchaseDate')}>
              <Input
                type="date"
                {...describedBy(f('pdate'), show('purchaseDate'))}
                value={purchaseDate}
                max={todayISO()}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
            </Field>
            <Field label="Price (optional)" htmlFor={f('price')} error={show('price')} aside="₹">
              <Input
                {...decimalProps}
                {...describedBy(f('price'), show('price'))}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
              />
            </Field>
            {editing ? (
              <Field
                label="Odometer"
                htmlFor={f('odo')}
                hint="Update it from Quick log."
                aside="km"
              >
                <Input
                  id={f('odo')}
                  value={bike?.odometer.toLocaleString('en-IN')}
                  readOnly
                  aria-describedby={`${f('odo')}-hint`}
                  className="opacity-70"
                />
              </Field>
            ) : (
              <Field label="Current odometer" htmlFor={f('odo')} error={show('odo')} aside="km">
                <Input
                  {...numericProps}
                  {...describedBy(f('odo'), show('odo'))}
                  value={odo}
                  onChange={(e) => setOdo(e.target.value)}
                  placeholder="0"
                />
              </Field>
            )}
          </div>
        </Card>

        {!editing && (
          <Card className="flex flex-col gap-4 p-4 sm:p-5">
            <fieldset>
              <legend className="mb-1 font-display text-xl font-semibold tracking-wide uppercase">
                Service schedule
              </legend>
              <p className="mb-3 text-sm text-muted">
                Start from a template — you can add, edit or switch off items later.
              </p>
              <div
                role="radiogroup"
                aria-label="Schedule template"
                className="grid grid-cols-1 gap-2 sm:grid-cols-3"
              >
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="radio"
                    aria-checked={template === t.id}
                    onClick={() => setTemplate(t.id)}
                    className={cn(
                      'cursor-pointer rounded-2xl border p-3.5 text-left transition-colors',
                      template === t.id
                        ? 'border-accent bg-[color-mix(in_oklab,var(--accent)_10%,transparent)]'
                        : 'border-line hover:border-line-strong',
                    )}
                  >
                    <span className="block font-semibold">{t.name}</span>
                    <span className="mt-0.5 block text-xs text-muted">{t.description}</span>
                  </button>
                ))}
              </div>
            </fieldset>
            {selectedTemplate && (
              <ul
                className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2"
                aria-label={`${selectedTemplate.name} items`}
              >
                {selectedTemplate.items.map((i) => (
                  <li
                    key={i.name}
                    className="flex justify-between gap-3 border-b border-line py-1.5"
                  >
                    <span>{i.name}</span>
                    <span className="num text-faint">{describeInterval(i)}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Last full service at"
                htmlFor={f('lastkm')}
                error={show('lastKm')}
                hint="Blank = current odometer"
                aside="km"
              >
                <Input
                  {...numericProps}
                  {...describedBy(f('lastkm'), show('lastKm'), true)}
                  value={lastKm}
                  onChange={(e) => setLastKm(e.target.value)}
                  placeholder={odo || '0'}
                />
              </Field>
              <Field label="Last full service on" htmlFor={f('lastdate')} error={show('lastDate')}>
                <Input
                  type="date"
                  {...describedBy(f('lastdate'), show('lastDate'))}
                  value={lastDate}
                  max={todayISO()}
                  onChange={(e) => setLastDate(e.target.value)}
                />
              </Field>
            </div>
          </Card>
        )}

        {submitted && !valid && (
          <p role="alert" className="text-sm font-medium text-overdue">
            Fix the highlighted fields to continue.
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
          {bike && (
            <Button variant="danger-ghost" onClick={() => setConfirmDelete(true)}>
              <Trash2 /> Delete bike
            </Button>
          )}
          <Button type="submit" size="lg" className="sm:ml-auto sm:min-w-56">
            {bike ? 'Save changes' : 'Add to garage'}
          </Button>
        </div>
      </form>

      {bike && (
        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title={`Delete ${bike.nickname}?`}
          description="Its schedule, fuel log, services, rides and documents go with it. You can undo right after."
          confirmLabel="Delete bike"
          destructive
          onConfirm={() => {
            const removed = remove('bike', bike.id);
            navigate('/', { replace: true });
            undoToast(`${bike.nickname} deleted`, removed);
          }}
        />
      )}
    </Page>
  );
}
