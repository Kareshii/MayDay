<script setup lang="ts">
import { SelectContent, SelectPortal, SelectViewport } from 'reka-ui'
import { cn } from '@/utils/cn'

const attrs = useAttrs()
</script>

<template>
  <SelectPortal>
    <SelectContent
      v-bind="attrs"
      :class="cn(
        'z-[130] max-h-72 min-w-[8rem] overflow-hidden rounded-xl border border-[var(--border-soft)] bg-white text-[var(--text-primary)] shadow-none outline-none dark:bg-[#141721] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        attrs.class as string,
      )"
    >
      <SelectViewport class="p-1">
        <slot />
      </SelectViewport>
    </SelectContent>
  </SelectPortal>
</template>
