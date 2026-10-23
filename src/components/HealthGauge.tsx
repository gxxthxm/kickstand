import { motion } from 'framer-motion';
import type { Health } from '@/lib/due';
import { cn } from '@/lib/utils';

interface HealthGaugeProps {
  health: Health;
  size?: number;
  className?: string;
  /** Show the "HEALTH" caption under the number. */
  caption?: boolean;
}

const SWEEP = 270;
const START = 135; // degrees, measured clockwise from 3 o'clock

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arc(cx: number, cy: number, r: number, from: number, to: number) {
  const a = polar(cx, cy, r, from);
  const b = polar(cx, cy, r, to);
  const large = to - from > 180 ? 1 : 0;
  return `M ${a.x} ${a.y} A ${r} ${r} 0 ${large} 1 ${b.x} ${b.y}`;
}

export const healthColour = (h: Health) =>
  h.overdue > 0 ? 'var(--overdue)' : h.dueSoon > 0 ? 'var(--soon)' : 'var(--ok)';

/** Bike health as a 270° instrument gauge: share of enabled items that are OK. */
export function HealthGauge({ health, size = 88, className, caption = true }: HealthGaugeProps) {
  const pct = Math.round(health.ratio * 100);
  const c = 50;
  const r = 40;
  const colour = healthColour(health);
  const ticks = Array.from({ length: 11 }, (_, i) => START + (SWEEP / 10) * i);
  const label = `Health ${pct}%: ${health.ok} of ${health.total} items OK${
    health.overdue ? `, ${health.overdue} overdue` : ''
  }${health.dueSoon ? `, ${health.dueSoon} due soon` : ''}`;

  return (
    <div
      className={cn('relative shrink-0', className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={label}
    >
      <svg viewBox="0 0 100 100" className="size-full" aria-hidden>
        {ticks.map((deg, i) => {
          const a = polar(c, c, 48, deg);
          const b = polar(c, c, i % 5 === 0 ? 44 : 46, deg);
          return (
            <line
              key={deg}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="var(--line-strong)"
              strokeWidth={1.2}
            />
          );
        })}
        <path
          d={arc(c, c, r, START, START + SWEEP)}
          fill="none"
          stroke="var(--line)"
          strokeWidth={7}
          strokeLinecap="round"
        />
        <motion.path
          d={arc(c, c, r, START, START + SWEEP)}
          fill="none"
          stroke={colour}
          strokeWidth={7}
          strokeLinecap="round"
          initial={false}
          animate={{ pathLength: Math.max(0.001, health.ratio) }}
          transition={{ type: 'spring', stiffness: 80, damping: 18 }}
        />
      </svg>
      <div aria-hidden className="absolute inset-0 flex flex-col items-center justify-center pt-1">
        <span className="font-display leading-none font-semibold" style={{ fontSize: size * 0.3 }}>
          {pct}
          <span className="text-[0.5em] text-muted">%</span>
        </span>
        {caption && size >= 72 && <span className="label-caps mt-0.5 !text-[0.6rem]">Health</span>}
      </div>
    </div>
  );
}
