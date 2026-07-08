import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          'bg-[linear-gradient(180deg,#FCD34D_25%,#FFCA1D)] brightness-[1.07] text-primary-foreground hover:brightness-110 shadow-[0_1px_3px_0_rgba(0,0,0,0.15),0_7px_14px_0_rgba(0,0,0,0.08),inset_0_-2px_3px_0_#cb9b00,inset_0_1px_1px_0_#ffdd00,inset_0_8px_14px_0_#ffca1d]',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'bg-background dark:bg-[linear-gradient(180deg,#363B45,#262931)] text-foreground hover:bg-accent shadow-[0_1px_3px_0_rgba(0,0,0,0.25),0_7px_14px_0_rgba(0,0,0,0.08),inset_0_-2px_3px_0_rgba(0,0,0,0.15),inset_0_1px_1px_0_#ffffff,inset_0_8px_14px_0_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),inset_0_-1px_1px_0_rgba(0,0,0,0.35),0_0_0_0.5px_rgba(0,0,0,0.5),0_1px_2px_0_rgba(0,0,0,0.4),0_3px_6px_0_rgba(0,0,0,0.45)]',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        xs: "h-6 gap-1 rounded-full px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: 'h-8 rounded-full gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-full px-6 has-[>svg]:px-4',
        icon: 'size-9',
        'icon-xs': "size-6 rounded-full [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : 'button'

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
