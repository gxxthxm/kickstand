import type { ReactNode } from 'react';

/** Shared tooltip frame for all charts. */
export function TooltipFrame({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <div className="num min-w-36 rounded-xl border border-line-strong bg-bg-raised px-3 py-2 text-sm shadow-xl">
      <p className="mb-1 text-xs font-semibold text-muted">{title}</p>
      {children}
    </div>
  );
}

export const axisProps = {
  stroke: 'var(--faint)',
  tick: { fill: 'var(--faint)', fontSize: 12 },
  tickLine: false,
  axisLine: false,
} as const;
