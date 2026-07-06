<script setup lang="ts">
import { Primitive } from 'reka-ui'
import { cn } from '@/utils/cn'

interface Props {
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <Primitive
    as="caption"
    :class="cn('mt-4 text-sm text-[var(--text-secondary)]', props.class)"
  >
    <slot />
  </Primitive>
</template>
