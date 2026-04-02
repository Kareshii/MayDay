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
    v-model:checked="model"
    :disabled="props.disabled"
    :class="cn('flex size-5 items-center justify-center rounded border border-[var(--border)] bg-[var(--card-bg)] text-white outline-none transition focus-visible:ring-2 focus-visible:ring-black/20 data-[state=checked]:border-black data-[state=checked]:bg-black dark:focus-visible:ring-white/20 dark:data-[state=checked]:border-white dark:data-[state=checked]:bg-white dark:data-[state=checked]:text-black', props.class)"
  >
    <CheckboxIndicator>
      <Icon name="lucide:check" class="size-3.5" />
    </CheckboxIndicator>
  </CheckboxRoot>
</template>
