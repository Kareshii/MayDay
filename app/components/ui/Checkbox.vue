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
    :class="cn('grid size-5 shrink-0 place-items-center rounded-md border border-[var(--border-soft)] bg-[var(--surface-card)] leading-none text-white outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] data-[state=checked]:border-[var(--primary)] data-[state=checked]:bg-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-65', props.class)"
  >
    <CheckboxIndicator class="grid size-full place-items-center leading-none">
      <Icon name="lucide:check" class="block size-3.5 shrink-0" />
    </CheckboxIndicator>
  </CheckboxRoot>
</template>
