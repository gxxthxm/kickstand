import { cn } from '@/lib/utils';

/** Gauge mark + condensed wordmark. */
export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden>
        <rect width="32" height="32" rx="9" fill="var(--accent)" />
        <path
          d="M8.5 21.5a8.5 8.5 0 1 1 15 0"
          fill="none"
          stroke="var(--on-accent)"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <path
          d="M16 17.5 21 11"
          stroke="var(--on-accent)"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <circle cx="16" cy="17.5" r="2.4" fill="var(--on-accent)" />
      </svg>
      {!compact && (
        <span className="font-display text-[1.375rem] leading-none font-bold tracking-[0.08em] uppercase">
          Kickstand
        </span>
      )}
    </span>
  );
}
