import { AlertDialog as A } from 'radix-ui';
import type { ReactNode } from 'react';
import { buttonVariants } from './button';
import { cn } from '@/lib/utils';

interface ConfirmProps {
  open: boolean;
  onOpenChange(open: boolean): void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  onConfirm(): void;
  destructive?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  destructive,
}: ConfirmProps) {
  return (
    <A.Root open={open} onOpenChange={onOpenChange}>
      <A.Portal>
        <A.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-[fade-in_200ms_ease-out]" />
        <A.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-[1.5rem] border border-line bg-bg-raised p-6 shadow-2xl data-[state=open]:animate-[pop-in_200ms_ease-out]">
          <A.Title className="font-display text-2xl font-semibold tracking-wide">{title}</A.Title>
          <A.Description className="mt-2 text-sm text-muted">{description}</A.Description>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <A.Cancel className={buttonVariants({ variant: 'secondary' })}>Cancel</A.Cancel>
            <A.Action
              className={cn(buttonVariants({ variant: destructive ? 'danger' : 'primary' }))}
              onClick={onConfirm}
            >
              {confirmLabel}
            </A.Action>
          </div>
        </A.Content>
      </A.Portal>
    </A.Root>
  );
}
