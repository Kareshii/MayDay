import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'

export { default as Button } from './Button.vue'

export const buttonVariants = cva(
  'inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-all outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border border-transparent bg-[var(--primary)] text-white shadow-none hover:bg-[var(--primary-strong)]',
        secondary: 'border border-transparent bg-[var(--surface-high)] text-[var(--text-primary)] hover:bg-[var(--surface-highest)]',
        outline: 'border border-[var(--border-soft)] bg-[var(--surface-card)] text-[var(--text-primary)] hover:bg-[var(--surface-low)]',
        ghost: 'border border-transparent bg-transparent text-[var(--text-primary)] hover:bg-[var(--surface-low)]',
        destructive: 'border border-transparent bg-[var(--danger)] text-white shadow-none hover:bg-[var(--danger-strong)]',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-11 px-6 text-base',
        icon: 'size-10',
        'icon-sm': 'size-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export type ButtonVariants = VariantProps<typeof buttonVariants>
