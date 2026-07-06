<script setup lang="ts">
import { PaginationRoot } from 'reka-ui'
import { cn } from '@/utils/cn'

const attrs = useAttrs()
</script>

<template>
  <PaginationRoot
    v-bind="attrs"
    :class="cn('flex items-center gap-2', attrs.class as string)"
  >
    <slot />
  </PaginationRoot>
</template>
