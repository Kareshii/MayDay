<script setup lang="ts">
import { MenubarTrigger } from 'reka-ui'
import { cn } from '@/utils/cn'

const attrs = useAttrs()
</script>

<template>
  <MenubarTrigger
    v-bind="attrs"
    :class="cn('inline-flex cursor-pointer items-center justify-center rounded-full outline-none transition-colors hover:bg-[var(--surface-low)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] data-[state=open]:bg-[var(--surface-low)]', attrs.class as string)"
  >
    <slot />
  </MenubarTrigger>
</template>
