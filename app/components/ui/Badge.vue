<script setup lang="ts">
import { cva } from 'class-variance-authority'
import { cn } from '@/utils/cn'

const badgeVariants = cva('inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] uppercase', {
  variants: {
    variant: {
      default: 'bg-[var(--primary)] text-white',
      secondary: 'bg-[var(--surface-high)] text-[var(--text-primary)]',
      success: 'bg-[var(--primary-soft)] text-[var(--primary)]',
      warning: 'bg-[var(--tertiary-soft)] text-[var(--tertiary)]',
      outline: 'border border-[var(--border-soft)] text-[var(--text-primary)]',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

type BadgeVariant = 'default' | 'secondary' | 'success' | 'warning' | 'outline'

interface Props {
  variant?: BadgeVariant
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  class: '',
})
</script>

<template>
  <span :class="cn(badgeVariants({ variant: props.variant }), props.class)">
    <slot />
  </span>
</template>
