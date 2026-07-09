<script setup lang="ts">
import type { PaginationRootEmits, PaginationRootProps } from 'reka-ui'
import { PaginationRoot } from 'reka-ui'
import { cn } from '@/utils/cn'

const props = withDefaults(defineProps<PaginationRootProps & {
  class?: string
}>(), {
  class: '',
  total: 0,
  siblingCount: 2,
  defaultPage: 1,
  showEdges: false,
})
const emit = defineEmits<PaginationRootEmits>()
const attrs = useAttrs()
</script>

<template>
  <PaginationRoot
    v-bind="{ ...props, ...attrs }"
    :class="cn('flex items-center gap-2', attrs.class as string, props.class)"
    @update:page="emit('update:page', $event)"
  >
    <slot />
  </PaginationRoot>
</template>
