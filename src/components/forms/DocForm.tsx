import { useId, useState, type FormEvent } from 'react';
import { addYears, format } from 'date-fns';
import { toast } from 'sonner';
import { todayISO } from '@/lib/dates';
import { parseNumber } from '@/lib/format';
import { DOC_TYPES, type BikeDoc, type DocType } from '@/lib/types';
import { useGarage } from '@/store/garage';
import { describedBy, Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Chip } from '@/components/ui/segmented';
import { createdToast } from '@/components/toasts';
import { decimalProps, FormFooter, numStr } from './shared';

interface Props {
  bikeId: string;
  entry?: BikeDoc;
  onDone(): void;
}

export function DocForm({ bikeId, entry, onDone }: Props) {
  const uid = useId();
  const id = (s: string) => `${uid}-${s}`;
  const addDoc = useGarage((s) => s.addDoc);
  const updateDoc = useGarage((s) => s.updateDoc);
  const [type, setType] = useState<DocType>(entry?.type ?? 'Insurance');
  const [number, setNumber] = useState(entry?.number ?? '');
  const [expiresAt, setExpiresAt] = useState(
    entry?.expiresAt ?? format(addYears(new Date(), 1), 'yyyy-MM-dd'),
  );
  const [issuedAt, setIssuedAt] = useState(entry?.issuedAt ?? todayISO());
  const [cost, setCost] = useState(numStr(entry?.cost));
  const [submitted, setSubmitted] = useState(false);

  const costN = cost.trim() === '' ? undefined : parseNumber(cost);
  const errors = {
    expiresAt: expiresAt ? null : 'Pick the expiry date.',
    issuedAt:
      issuedAt && expiresAt && issuedAt > expiresAt ? 'Issued date is after the expiry.' : null,
    cost:
      costN !== undefined && (Number.isNaN(costN) || costN < 0)
        ? 'Enter a cost, or leave blank.'
        : null,
  };
  const show = (k: keyof typeof errors) => (submitted ? errors[k] : null);

  function submit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (Object.values(errors).some(Boolean)) return;
    const record = {
      bikeId,
      type,
      number: number.trim() || undefined,
      expiresAt,
      issuedAt: issuedAt || undefined,
      cost: costN,
    };
    if (entry) {
      updateDoc(entry.id, record);
      toast.success(`${type} updated`);
    } else {
      const saved = addDoc(record);
      createdToast(`${type} added`, 'doc', saved.id);
    }
    onDone();
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <div role="radiogroup" aria-label="Document type" className="flex flex-wrap gap-2">
        {DOC_TYPES.map((t) => (
          <Chip key={t} pressed={type === t} onPressedChange={() => setType(t)}>
            {t}
          </Chip>
        ))}
      </div>
      <Field label="Number (optional)" htmlFor={id('number')}>
        <Input
          id={id('number')}
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder={type === 'Registration' ? 'KA 01 AB 1234' : 'Policy / certificate no.'}
          autoComplete="off"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Issued / renewed" htmlFor={id('issued')} error={show('issuedAt')}>
          <Input
            type="date"
            {...describedBy(id('issued'), show('issuedAt'))}
            value={issuedAt}
            onChange={(e) => setIssuedAt(e.target.value)}
          />
        </Field>
        <Field label="Expires" htmlFor={id('expires')} error={show('expiresAt')}>
          <Input
            type="date"
            {...describedBy(id('expires'), show('expiresAt'))}
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
        </Field>
      </div>
      <Field
        label="Cost (optional)"
        htmlFor={id('cost')}
        error={show('cost')}
        aside="₹"
        hint="Counts towards documents in Costs."
      >
        <Input
          {...decimalProps}
          {...describedBy(id('cost'), show('cost'), true)}
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          placeholder="0"
        />
      </Field>
      <FormFooter label={entry ? 'Save changes' : 'Add document'} />
    </form>
  );
}
