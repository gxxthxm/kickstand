import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { convertEconomy, economyUnitLabel, type EconomyReading } from '@/lib/fuel';
import { formatDate, formatKm } from '@/lib/format';
import type { EconomyUnit } from '@/lib/types';
import { axisProps, TooltipFrame } from './ChartTooltip';

interface Props {
  readings: EconomyReading[];
  average: number;
  unit: EconomyUnit;
  colour?: string;
}

interface Point {
  date: string;
  odometer: number;
  value: number;
  distance: number;
}

/** km/l (or l/100km) per full-to-full reading, with the average as a dashed line. */
export default function EconomyChart({ readings, average, unit, colour = 'var(--accent)' }: Props) {
  const data: Point[] = readings.map((r) => ({
    date: r.date,
    odometer: r.odometer,
    value: Number(convertEconomy(r.kmpl, unit).toFixed(2)),
    distance: r.distance,
  }));
  const avg = convertEconomy(average, unit);
  const values = data.map((d) => d.value);
  const pad = Math.max(1, (Math.max(...values) - Math.min(...values)) * 0.12);
  const domain: [number, number] = [
    Math.floor(Math.min(...values, avg) - pad),
    Math.ceil(Math.max(...values, avg) + pad),
  ];
  const label = economyUnitLabel(unit);

  return (
    <div className="h-56 w-full" role="figure" aria-label={`Fuel economy chart, ${label} per tank`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
          <XAxis
            dataKey="date"
            {...axisProps}
            tickFormatter={(d: string) => formatDate(d)}
            minTickGap={28}
          />
          <YAxis
            {...axisProps}
            domain={domain}
            allowDecimals={false}
            tickFormatter={(v: number) => v.toFixed(0)}
            width={44}
          />
          <ReferenceLine
            y={avg}
            stroke="var(--muted)"
            strokeDasharray="5 5"
            label={{
              value: `avg ${avg.toFixed(1)}`,
              position: 'insideTopRight',
              fill: 'var(--muted)',
              fontSize: 12,
            }}
          />
          <Tooltip
            cursor={{ stroke: 'var(--line-strong)' }}
            content={({ active, payload }) => {
              const p = active ? (payload?.[0]?.payload as Point | undefined) : undefined;
              if (!p) return null;
              return (
                <TooltipFrame title={formatDate(p.date)}>
                  <p className="font-display text-xl font-semibold">
                    {p.value.toFixed(1)} <span className="text-sm text-muted">{label}</span>
                  </p>
                  <p className="text-xs text-muted">
                    at {formatKm(p.odometer)} · {formatKm(p.distance)} tank
                  </p>
                </TooltipFrame>
              );
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={colour}
            strokeWidth={2.5}
            dot={{ r: 2.5, fill: colour, strokeWidth: 0 }}
            activeDot={{ r: 5, stroke: 'var(--card)', strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
