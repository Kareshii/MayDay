<script setup lang="ts">
import { PaginationList } from 'reka-ui'
import { cn } from '@/utils/cn'

const attrs = useAttrs()
</script>

<template>
  <PaginationList
    v-slot="{ items }"
    v-bind="attrs"
    :class="cn('flex items-center gap-1', attrs.class as string)"
  >
    <slot :items="items" />
  </PaginationList>
</template>
