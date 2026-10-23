import { Dialog as DialogPrimitive } from 'radix-ui';
import { X } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

interface SheetContentProps extends Omit<ComponentProps<typeof DialogPrimitive.Content>, 'title'> {
  title: ReactNode;
  description?: ReactNode;
  /** Visually hide the title (it is still announced). */
  hideTitle?: boolean;
  headerExtra?: ReactNode;
}

/**
 * Bottom sheet on phones (grab handle, rounded top), centred panel from 768px up.
 */
export function SheetContent({
  className,
  children,
  title,
  description,
  hideTitle,
  headerExtra,
  ...props
}: SheetContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] data-[state=closed]:animate-[fade-out_150ms_ease-in] data-[state=open]:animate-[fade-in_200ms_ease-out]" />
      <DialogPrimitive.Content
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-[1.75rem] border border-b-0 border-line bg-bg-raised shadow-2xl outline-none',
          'data-[state=closed]:animate-[sheet-out_180ms_ease-in] data-[state=open]:animate-[sheet-in_260ms_cubic-bezier(0.2,0.9,0.3,1)]',
          'md:inset-x-auto md:top-1/2 md:bottom-auto md:left-1/2 md:w-full md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[1.75rem] md:border-b',
          'md:data-[state=closed]:animate-[fade-out_150ms_ease-in] md:data-[state=open]:animate-[pop-in_200ms_ease-out]',
          className,
        )}
        // No description → tell Radix there isn't one rather than repeating the title.
        {...(description ? {} : { 'aria-describedby': undefined })}
        {...props}
      >
        <div
          aria-hidden
          className="mx-auto mt-2.5 h-1.5 w-11 shrink-0 rounded-full bg-line-strong md:hidden"
        />
        <div className="flex shrink-0 items-start gap-3 px-5 pt-3 pb-2 md:pt-5">
          <div className="min-w-0 flex-1">
            <DialogPrimitive.Title
              className={cn('font-display text-2xl font-semibold', hideTitle && 'sr-only')}
            >
              {title}
            </DialogPrimitive.Title>
            {description && (
              <DialogPrimitive.Description className="mt-0.5 text-sm text-muted">
                {description}
              </DialogPrimitive.Description>
            )}
          </div>
          {headerExtra}
          <DialogPrimitive.Close className="-mt-1 -mr-2 grid grid-cols-1 size-11 shrink-0 cursor-pointer place-items-center rounded-full text-muted hover:bg-well hover:text-fg">
            <X className="size-5" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-1 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
