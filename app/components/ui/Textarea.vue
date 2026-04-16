<script setup lang="ts">
import { cn } from '@/utils/cn'

interface Props {
  class?: string
  disabled?: boolean
  modelValue?: string
}

defineProps<Props>()
defineEmits(['update:modelValue'])
const attrs = useAttrs()
</script>

<template>
  <textarea
    v-bind="attrs"
    :value="modelValue"
    :disabled="disabled"
    :class="cn('flex min-h-[120px] w-full rounded-xl border border-[var(--border)] bg-[var(--card-bg)] px-4 py-3 text-sm leading-7 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-secondary)]/70 focus:border-black/40 dark:focus:border-white/40', attrs.class as string, $props.class)"
    @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
  />
</template>
