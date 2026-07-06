<script setup lang="ts">
import { PaginationEllipsis } from 'reka-ui'
import { cn } from '@/utils/cn'

const attrs = useAttrs()
</script>

<template>
  <PaginationEllipsis
    v-bind="attrs"
    :class="cn('inline-flex size-9 items-center justify-center text-sm font-semibold text-[var(--text-muted)]', attrs.class as string)"
  >
    <slot>
      ...
    </slot>
  </PaginationEllipsis>
</template>
