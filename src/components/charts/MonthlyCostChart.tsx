import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { COST_CATEGORIES, COST_LABELS, type MonthCost } from '@/lib/costs';
import { formatMoney, formatMoneyCompact } from '@/lib/format';
import { axisProps, TooltipFrame } from './ChartTooltip';

export const CATEGORY_COLOUR = {
  fuel: 'var(--cat-fuel)',
  service: 'var(--cat-service)',
  parts: 'var(--cat-parts)',
  documents: 'var(--cat-documents)',
} as const;

/** Last 12 months stacked by category. */
export default function MonthlyCostChart({
  months,
  height = 260,
}: {
  months: MonthCost[];
  height?: number;
}) {
  return (
    <div
      className="w-full"
      style={{ height }}
      role="figure"
      aria-label={'Monthly costs chart, stacked by category'}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={months}
          margin={{ top: 8, right: 4, bottom: 0, left: -8 }}
          barCategoryGap="22%"
        >
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
          <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" minTickGap={4} />
          <YAxis {...axisProps} width={48} tickFormatter={(v: number) => formatMoneyCompact(v)} />
          <Tooltip
            cursor={{ fill: 'var(--well)' }}
            content={({ active, payload }) => {
              const m = active ? (payload?.[0]?.payload as MonthCost | undefined) : undefined;
              if (!m) return null;
              return (
                <TooltipFrame title={m.label}>
                  <p className="font-display text-xl font-semibold">{formatMoney(m.total)}</p>
                  <ul className="mt-1 space-y-0.5 text-xs">
                    {COST_CATEGORIES.filter((c) => m[c] > 0).map((c) => (
                      <li key={c} className="flex items-center justify-between gap-4">
                        <span className="flex items-center gap-1.5 text-muted">
                          <span
                            className="size-2 rounded-sm"
                            style={{ background: CATEGORY_COLOUR[c] }}
                          />
                          {COST_LABELS[c]}
                        </span>
                        {formatMoney(m[c])}
                      </li>
                    ))}
                  </ul>
                </TooltipFrame>
              );
            }}
          />
          {COST_CATEGORIES.map((c, i) => (
            <Bar
              key={c}
              dataKey={c}
              stackId="cost"
              fill={CATEGORY_COLOUR[c]}
              radius={i === COST_CATEGORIES.length - 1 ? [4, 4, 0, 0] : 0}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
