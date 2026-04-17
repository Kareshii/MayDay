<script setup lang="ts">
import { CheckboxIndicator, CheckboxRoot } from 'reka-ui'
import { cn } from '@/utils/cn'

const model = defineModel<boolean>({ default: false })

interface Props {
  class?: string
  disabled?: boolean
}

const props = defineProps<Props>()
</script>

<template>
  <CheckboxRoot
    v-model="model"
    :disabled="props.disabled"
    :class="cn('flex size-5 items-center justify-center rounded-md border border-[var(--border-soft)] bg-[var(--surface-card)] text-white outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] data-[state=checked]:border-[var(--primary)] data-[state=checked]:bg-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-65', props.class)"
  >
    <CheckboxIndicator>
      <Icon name="lucide:check" class="size-3.5" />
    </CheckboxIndicator>
  </CheckboxRoot>
</template>
