<script setup lang="ts">
import { SelectIcon, SelectTrigger } from 'reka-ui'
import { cn } from '@/utils/cn'

interface Props {
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  class: '',
})
const attrs = useAttrs()
</script>

<template>
  <SelectTrigger
    v-bind="attrs"
    data-slot="select-trigger"
    :class="cn(
      'flex h-9 w-full max-w-[11.25rem] min-w-0 items-center justify-between gap-2 rounded-md border border-[var(--border-strong)] bg-[var(--surface-card)] px-3 py-1.5 text-sm text-[var(--text-primary)] shadow-none outline-none transition-all duration-200 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-65 data-[placeholder]:text-[var(--text-muted)]',
      attrs.class as string,
      props.class,
    )"
  >
    <slot />
    <SelectIcon as-child>
      <Icon name="lucide:chevron-down" class="size-4 shrink-0 text-[var(--text-muted)]" />
    </SelectIcon>
  </SelectTrigger>
</template>
