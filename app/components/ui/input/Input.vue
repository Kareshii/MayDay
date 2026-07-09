<script setup lang="ts">
import { cn } from '@/utils/cn'

interface Props {
  class?: string
  disabled?: boolean
  modelValue?: string | number
  variant?: 'default' | 'ghost'
}

const props = withDefaults(defineProps<Props>(), {
  class: '',
  disabled: false,
  modelValue: undefined,
  variant: 'default',
})

defineEmits(['update:modelValue'])
const attrs = useAttrs()
</script>

<template>
  <input
    v-bind="attrs"
    :value="modelValue"
    :disabled="disabled"
    :class="cn(
      'flex h-10 w-full rounded-xl px-3 py-2 text-sm shadow-none outline-none transition-all duration-200 placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-70',
      props.variant === 'default' && 'border border-[var(--border-strong)] bg-[var(--surface-card)] text-[var(--text-primary)] focus:border-[var(--primary)]',
      props.variant === 'ghost' && 'border border-transparent bg-transparent text-[var(--text-primary)] hover:bg-[var(--surface-hover)] focus:border-[var(--primary)] focus:bg-[var(--surface-card)]',
      attrs.class as string,
      props.class,
    )"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  >
</template>
恰
