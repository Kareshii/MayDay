<script setup lang="ts">
import { cn } from '@/utils/cn'

interface Props {
  class?: string
  disabled?: boolean
  modelValue?: string
  variant?: 'default' | 'ghost'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
})
defineEmits(['update:modelValue'])
const attrs = useAttrs()
const textareaRef = ref<HTMLTextAreaElement | null>(null)

function focus(options?: FocusOptions) {
  textareaRef.value?.focus(options)
}

function setSelectionRange(
  start: number,
  end: number,
  direction?: 'forward' | 'backward' | 'none',
) {
  textareaRef.value?.setSelectionRange(start, end, direction)
}

defineExpose({
  focus,
  setSelectionRange,
  get selectionStart() {
    return textareaRef.value?.selectionStart ?? 0
  },
  get selectionEnd() {
    return textareaRef.value?.selectionEnd ?? 0
  },
})
</script>

<template>
  <textarea
    ref="textareaRef"
    v-bind="attrs"
    :value="modelValue"
    :disabled="disabled"
    :class="cn(
      'flex min-h-[128px] w-full rounded-xl px-3 py-3 text-sm leading-7 shadow-none outline-none transition-all duration-200 placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-70',
      props.variant === 'default' && 'border border-[var(--border-strong)] bg-[var(--surface-card)] text-[var(--text-primary)] focus:border-[var(--primary)]',
      props.variant === 'ghost' && 'border border-transparent bg-transparent text-[var(--text-primary)] hover:bg-[var(--surface-hover)] focus:border-[var(--primary)] focus:bg-[var(--surface-card)]',
      attrs.class as string,
      props.class,
    )"
    @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
  />
</template>
