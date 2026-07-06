<script setup lang="ts">
import { cn } from '@/utils/cn'

interface Props {
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <div
    :class="cn('rounded-lg border border-[var(--border-soft)] bg-[var(--surface-card)] shadow-none', props.class)"
  >
    <slot />
  </div>
</template>
