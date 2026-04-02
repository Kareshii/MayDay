<script setup lang="ts">
import { cva } from 'class-variance-authority'
import { cn } from '@/utils/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-black/20 disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-white/20',
  {
    variants: {
      variant: {
        default: 'bg-black text-white hover:bg-black/85 dark:bg-white dark:text-black dark:hover:bg-white/85',
        secondary: 'bg-[var(--card-bg)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-black/[0.04] dark:hover:bg-white/[0.08]',
        outline: 'border border-[var(--border)] bg-transparent text-[var(--text-primary)] hover:bg-black/[0.04] dark:hover:bg-white/[0.08]',
        ghost: 'text-[var(--text-primary)] hover:bg-black/[0.04] dark:hover:bg-white/[0.08]',
        destructive: 'bg-red-600 text-white hover:bg-red-500',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-lg px-3',
        lg: 'h-11 rounded-xl px-6',
        icon: 'size-10',
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
