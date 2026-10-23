import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function PageHeader({
  eyebrow,
  title,
  actions,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn('flex items-end justify-between gap-4 pt-6 pb-5 md:pt-10', className)}>
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-sm font-medium text-muted">{eyebrow}</p>}
        <h1 className="font-display text-4xl leading-tight font-semibold md:text-5xl">{title}</h1>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}

/** Page column: 16px gutters on phones, comfortable max width on desktop. */
export function Page({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-10', className)}>
      {children}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  children,
  actions,
  className,
}: {
  icon?: ReactNode;
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-[var(--radius-card)] border border-dashed border-line-strong px-6 py-10 text-center',
        className,
      )}
    >
      {icon && (
        <div className="mb-3 grid grid-cols-1 size-14 place-items-center rounded-2xl bg-well text-accent-ink [&_svg]:size-7">
          {icon}
        </div>
      )}
      <p className="font-display text-2xl font-semibold">{title}</p>
      {children && <div className="mt-1 max-w-sm text-sm text-muted">{children}</div>}
      {actions && <div className="mt-5 flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  );
}
