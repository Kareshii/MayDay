<script setup lang="ts">
import { Label, type LabelProps } from 'reka-ui'
import { cn } from '@/utils/cn'

const props = defineProps<LabelProps & {
  class?: string
}>()
const attrs = useAttrs()
</script>

<template>
  <Label
    v-bind="{ ...props, ...attrs }"
    :class="cn(
      'text-sm font-medium leading-none text-[var(--text-primary)] peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
      attrs.class as string,
      props.class,
    )"
  >
    <slot />
  </Label>
</template>
