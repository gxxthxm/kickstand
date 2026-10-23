import { ToggleGroup } from 'radix-ui';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Option<T extends string> {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
}

interface SegmentedProps<T extends string> {
  value: T;
  onValueChange(v: T): void;
  options: Option<T>[];
  label: string;
  className?: string;
  size?: 'default' | 'lg';
}

/** Single-choice segmented control (never empty). */
export function Segmented<const T extends string>({
  value,
  onValueChange,
  options,
  label,
  className,
  size = 'default',
}: SegmentedProps<T>) {
  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      onValueChange={(v) => v && onValueChange(v as T)}
      aria-label={label}
      className={cn('flex w-full gap-1 rounded-full border border-line bg-well p-1', className)}
    >
      {options.map((o) => (
        <ToggleGroup.Item
          key={o.value}
          value={o.value}
          className={cn(
            'flex min-w-0 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full px-2 text-sm font-semibold text-muted transition-colors hover:text-fg data-[state=on]:bg-fg data-[state=on]:text-bg [&_svg]:size-4 [&_svg]:shrink-0 [&>span]:inline-flex',
            size === 'lg' ? 'h-11' : 'h-10',
          )}
        >
          {o.icon && <span className="max-[400px]:hidden">{o.icon}</span>}
          <span className="truncate">{o.label}</span>
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}

interface ChipProps {
  pressed: boolean;
  onPressedChange(p: boolean): void;
  children: ReactNode;
  className?: string;
  /** Override the "on" colour (e.g. the bike's colour). */
  colour?: string;
}

/** Toggle chip for multi-select (tags, items, filters). */
export function Chip({ pressed, onPressedChange, children, className, colour }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={() => onPressedChange(!pressed)}
      style={colour && pressed ? { borderColor: colour } : undefined}
      className={cn(
        'inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors [&_svg]:size-4',
        pressed
          ? 'border-accent-ink bg-[color-mix(in_oklab,var(--accent)_16%,transparent)] text-fg'
          : 'border-line bg-well text-muted hover:border-line-strong hover:text-fg',
        className,
      )}
    >
      {children}
    </button>
  );
}
