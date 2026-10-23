import { useMemo, type ReactNode } from 'react';
import { bikeOdoPoints, type OdoPoint } from '@/lib/odometer';
import { useData } from '@/store/hooks';
import { Button } from '@/components/ui/button';

export function useOdoPoints(bikeId: string): OdoPoint[] {
  const data = useData();
  return useMemo(() => bikeOdoPoints(data, bikeId), [data, bikeId]);
}

/** Sticky full-width save bar at the bottom of a sheet. */
export function FormFooter({
  children,
  label,
  disabled,
}: {
  children?: ReactNode;
  label: string;
  disabled?: boolean;
}) {
  return (
    <div className="sticky bottom-0 -mx-5 mt-6 flex gap-2 border-t border-line bg-bg-raised/95 px-5 pt-3 pb-1 backdrop-blur">
      {children}
      <Button type="submit" size="lg" className="flex-1" disabled={disabled}>
        {label}
      </Button>
    </div>
  );
}

export const numericProps = {
  type: 'text',
  inputMode: 'numeric',
  autoComplete: 'off',
  enterKeyHint: 'next',
} as const;
export const decimalProps = {
  type: 'text',
  inputMode: 'decimal',
  autoComplete: 'off',
  enterKeyHint: 'next',
} as const;

/** Show a whole number without grouping in an input (easier to edit). */
export const numStr = (n: number | undefined) =>
  n === undefined || Number.isNaN(n) ? '' : String(n);
