import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatDate, formatKm, formatMoneyPrecise } from '@/lib/format';
import { axisProps, TooltipFrame } from './ChartTooltip';

interface Point {
  date: string;
  odometer: number;
  price: number;
}

/** Price per litre over time. */
export default function PriceChart({ points }: { points: Point[] }) {
  const prices = points.map((p) => p.price);
  const domain: [number, number] = [
    Math.floor(Math.min(...prices) - 0.5),
    Math.ceil(Math.max(...prices) + 0.5),
  ];
  return (
    <div className="h-32 w-full" role="figure" aria-label={'Price per litre chart'}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 6, right: 8, bottom: 0, left: -12 }}>
          <defs>
            <linearGradient id="price-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--cat-service)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--cat-service)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            {...axisProps}
            tickFormatter={(d: string) => formatDate(d)}
            minTickGap={40}
          />
          <YAxis
            {...axisProps}
            domain={domain}
            width={44}
            tickFormatter={(v: number) => v.toFixed(0)}
          />
          <Tooltip
            cursor={{ stroke: 'var(--line-strong)' }}
            content={({ active, payload }) => {
              const p = active ? (payload?.[0]?.payload as Point | undefined) : undefined;
              if (!p) return null;
              return (
                <TooltipFrame title={formatDate(p.date)}>
                  <p className="font-display text-xl font-semibold">
                    {formatMoneyPrecise(p.price)} <span className="text-sm text-muted">/l</span>
                  </p>
                  <p className="text-xs text-muted">at {formatKm(p.odometer)}</p>
                </TooltipFrame>
              );
            }}
          />
          <Area
            type="stepAfter"
            dataKey="price"
            stroke="var(--cat-service)"
            strokeWidth={2}
            fill="url(#price-fill)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
