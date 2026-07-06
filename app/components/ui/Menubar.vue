<script setup lang="ts">
import { MenubarRoot } from 'reka-ui'
import { cn } from '@/utils/cn'

const attrs = useAttrs()
</script>

<template>
  <MenubarRoot
    v-bind="attrs"
    :class="cn('flex items-center', attrs.class as string)"
  >
    <slot />
  </MenubarRoot>
</template>
