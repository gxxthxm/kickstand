import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export const fieldClass =
  'h-12 w-full min-w-0 rounded-xl border border-line bg-well px-3.5 text-base text-fg placeholder:text-faint transition-colors outline-none focus-visible:border-accent-ink focus-visible:outline-none aria-[invalid=true]:border-overdue disabled:opacity-50';

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(fieldClass, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea className={cn(fieldClass, 'h-auto min-h-20 py-3', className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<'select'>) {
  return (
    <select
      className={cn(fieldClass, 'appearance-none bg-[length:16px] pr-9', className)}
      {...props}
    />
  );
}
