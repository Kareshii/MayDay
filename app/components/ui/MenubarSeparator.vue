<script setup lang="ts">
import { MenubarSeparator } from 'reka-ui'
import { cn } from '@/utils/cn'

const attrs = useAttrs()
</script>

<template>
  <MenubarSeparator
    v-bind="attrs"
    :class="cn('-mx-1 my-1 h-px bg-[var(--border-soft)]', attrs.class as string)"
  />
</template>
