import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-[background-color,color,border-color,transform] select-none active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-on-accent hover:bg-[color-mix(in_oklab,var(--accent)_88%,white)]',
        secondary: 'border border-line bg-well text-fg hover:border-line-strong',
        ghost: 'text-fg hover:bg-well',
        outline: 'border border-line-strong text-fg hover:bg-well',
        danger: 'bg-overdue text-white light:text-white hover:opacity-90',
        'danger-ghost':
          'text-overdue hover:bg-[color-mix(in_oklab,var(--overdue)_12%,transparent)]',
      },
      size: {
        default: 'h-11 px-5 text-sm [&_svg]:size-4',
        sm: 'h-11 px-3.5 text-sm [&_svg]:size-4',
        lg: 'h-14 px-6 text-base [&_svg]:size-5',
        icon: 'size-11 [&_svg]:size-5',
      },
    },
    defaultVariants: { variant: 'primary', size: 'default' },
  },
);

export interface ButtonProps extends ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild, type, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button';
  return (
    <Comp
      type={asChild ? undefined : (type ?? 'button')}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
