<script setup lang="ts">
import { cva } from 'class-variance-authority'
import { cn } from '@/utils/cn'

const buttonVariants = cva(
  'inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border border-transparent bg-gradient-to-br from-[var(--primary)] to-[var(--primary-strong)] text-white shadow-[0_10px_24px_-16px_rgba(0,72,141,0.45)] hover:brightness-105',
        secondary: 'border border-transparent bg-[var(--surface-high)] text-[var(--text-primary)] hover:bg-[var(--surface-highest)]',
        outline: 'border border-[var(--border-soft)] bg-[var(--surface-card)]/60 text-[var(--text-primary)] hover:bg-[var(--surface-low)]',
        ghost: 'border border-transparent bg-transparent text-[var(--text-primary)] hover:bg-[var(--surface-low)]',
        destructive: 'border border-transparent bg-red-600 text-white shadow-[0_10px_24px_-16px_rgba(220,38,38,0.45)] hover:bg-red-500',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-lg px-3',
        lg: 'h-11 rounded-xl px-6 text-base',
        icon: 'size-10 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive'
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon'

interface Props {
  as?: string
  variant?: ButtonVariant
  size?: ButtonSize
}

const props = withDefaults(defineProps<Props>(), {
  as: 'button',
  variant: 'default',
  size: 'default',
})

const attrs = useAttrs()
</script>

<template>
  <component
    :is="props.as"
    v-bind="attrs"
    :class="cn(buttonVariants({ variant: props.variant, size: props.size }), attrs.class as string)"
  >
    <slot />
  </component>
</template>
