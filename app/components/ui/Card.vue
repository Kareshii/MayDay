<script setup lang="ts">
import { cn } from '@/utils/cn'

interface Props {
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <div
    :class="cn('rounded-[1.5rem] border border-[var(--border-soft)] bg-[var(--surface-card)] shadow-[var(--card-shadow)]', props.class)"
  >
    <slot />
  </div>
</template>
