<script setup lang="ts">
import { cn } from '@/utils/cn'

interface Props {
  class?: string
  disabled?: boolean
  modelValue?: string | number
}

defineProps<Props>()
defineEmits(['update:modelValue'])
const attrs = useAttrs()
</script>

<template>
  <input
    v-bind="attrs"
    :value="modelValue"
    :disabled="disabled"
    :class="cn(
      'flex h-11 w-full rounded-xl border border-[var(--border-soft)] bg-[var(--surface-card)] px-4 py-2 text-sm text-[var(--text-primary)] shadow-[0_0_0_1px_rgba(194,198,212,0.12)] outline-none transition placeholder:text-[var(--text-secondary)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-70',
      attrs.class as string,
      $props.class,
    )"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  >
</template>
