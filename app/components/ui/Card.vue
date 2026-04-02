<script setup lang="ts">
import { cn } from '@/utils/cn'

interface Props {
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <div
    :class="cn('rounded-3xl border border-[var(--border)] bg-[var(--card-bg)] shadow-[0_20px_40px_-32px_rgba(15,23,42,0.45)] backdrop-blur-xl', props.class)"
  >
    <slot />
  </div>
</template>
