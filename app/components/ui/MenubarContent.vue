<script setup lang="ts">
import { MenubarContent, MenubarPortal } from 'reka-ui'
import { cn } from '@/utils/cn'

const attrs = useAttrs()
</script>

<template>
  <MenubarPortal>
    <MenubarContent
      v-bind="attrs"
      :class="cn('z-[120] min-w-44 rounded-md border border-[var(--border-soft)] bg-white p-1 text-[var(--text-primary)] opacity-100 shadow-none outline-none dark:bg-[#141721] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95', attrs.class as string)"
    >
      <slot />
    </MenubarContent>
  </MenubarPortal>
</template>
