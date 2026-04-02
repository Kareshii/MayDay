<script setup lang="ts">
import { cva } from 'class-variance-authority'
import { cn } from '@/utils/cn'

const badgeVariants = cva('inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.18em] uppercase', {
  variants: {
    variant: {
      default: 'bg-black text-white dark:bg-white dark:text-black',
      secondary: 'bg-black/[0.05] text-[var(--text-primary)] dark:bg-white/[0.08]',
      success: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
      warning: 'bg-amber-500/12 text-amber-700 dark:text-amber-300',
      outline: 'border border-[var(--border)] text-[var(--text-primary)]',
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
