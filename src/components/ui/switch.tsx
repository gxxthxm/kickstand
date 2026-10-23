import { Switch as S } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export function Switch({ className, ...props }: ComponentProps<typeof S.Root>) {
  return (
    <S.Root
      className={cn(
        // 44px hit area around a 28px track
        'relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border border-line-strong bg-well transition-colors before:absolute before:-inset-2 before:content-[""] data-[state=checked]:border-accent data-[state=checked]:bg-accent',
        className,
      )}
      {...props}
    >
      <S.Thumb className="block size-5 translate-x-1 rounded-full bg-fg shadow transition-transform data-[state=checked]:translate-x-6 data-[state=checked]:bg-on-accent" />
    </S.Root>
  );
}
