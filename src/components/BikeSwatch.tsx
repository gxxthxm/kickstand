import { cn } from '@/lib/utils';

export function BikeSwatch({ colour, className }: { colour: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-block size-3 shrink-0 rounded-full ring-2 ring-black/30 light:ring-black/10',
        className,
      )}
      style={{ background: colour }}
    />
  );
}
