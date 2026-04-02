<script setup lang="ts">
import { cn } from '@/utils/cn'

interface Props {
  class?: string
  modelValue?: string | number
}

defineProps<Props>()
defineEmits(['update:modelValue'])
</script>

<template>
  <input
    :value="modelValue"
    :class="cn('flex h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--card-bg)] px-4 py-2 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-secondary)]/70 focus:border-black/40 dark:focus:border-white/40', $props.class)"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  >
</template>
