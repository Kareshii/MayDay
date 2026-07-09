<script setup lang="ts">
import type { AcceptableValue } from 'reka-ui'
import { SelectItem, SelectItemIndicator, SelectItemText } from 'reka-ui'
import { cn } from '@/utils/cn'

interface Props {
  class?: string
  value: AcceptableValue
  disabled?: boolean
  textValue?: string
}

const props = withDefaults(defineProps<Props>(), {
  class: '',
  disabled: false,
  textValue: undefined,
})
const attrs = useAttrs()
</script>

<template>
  <SelectItem
    v-bind="attrs"
    :value="props.value"
    :disabled="props.disabled"
    :text-value="props.textValue"
    :class="cn(
      'relative flex h-9 cursor-pointer select-none items-center rounded-lg py-2 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-[var(--surface-low)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-[var(--surface-low)]',
      attrs.class as string,
      props.class,
    )"
  >
    <span class="absolute left-2 flex size-4 items-center justify-center">
      <SelectItemIndicator>
        <Icon name="lucide:check" class="size-4" />
      </SelectItemIndicator>
    </span>
    <SelectItemText class="min-w-0 truncate">
      <slot />
    </SelectItemText>
  </SelectItem>
</template>
