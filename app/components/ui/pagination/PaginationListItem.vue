<script setup lang="ts">
import type { PaginationListItemProps } from 'reka-ui'
import { PaginationListItem } from 'reka-ui'
import { cn } from '@/utils/cn'

const props = withDefaults(defineProps<PaginationListItemProps & {
  class?: string
}>(), {
  as: 'button',
  class: '',
})
const attrs = useAttrs()
</script>

<template>
  <PaginationListItem
    v-bind="{ ...props, ...attrs }"
    :class="cn('inline-flex size-9 items-center justify-center rounded-md border border-transparent text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-low)] hover:text-[var(--text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] disabled:pointer-events-none disabled:opacity-50 data-[selected=true]:border-[var(--border-soft)] data-[selected=true]:bg-[var(--surface-card)] data-[selected=true]:text-[var(--text-primary)]', attrs.class as string, props.class)"
  >
    <slot />
  </PaginationListItem>
</template>
