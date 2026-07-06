<script setup lang="ts">
import { MenubarItem } from 'reka-ui'
import { cn } from '@/utils/cn'

const attrs = useAttrs()
</script>

<template>
  <MenubarItem
    v-bind="attrs"
    :class="cn('relative flex h-9 cursor-pointer select-none items-center gap-2 rounded-md px-2.5 text-sm outline-none transition-colors hover:bg-[var(--surface-low)] focus:bg-[var(--surface-low)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-[var(--surface-low)]', attrs.class as string)"
  >
    <slot />
  </MenubarItem>
</template>
