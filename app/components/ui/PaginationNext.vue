<script setup lang="ts">
import { PaginationNext } from 'reka-ui'
import { cn } from '@/utils/cn'

const attrs = useAttrs()
</script>

<template>
  <PaginationNext
    v-bind="attrs"
    :class="cn('inline-flex h-9 items-center justify-center gap-1 rounded-md border border-[var(--border-soft)] bg-[var(--surface-card)] px-3 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-low)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] disabled:pointer-events-none disabled:opacity-50', attrs.class as string)"
  >
    <slot />
  </PaginationNext>
</template>
