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
    as="thead"
    :class="cn('bg-[var(--surface-low)] text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]', props.class)"
  >
    <slot />
  </Primitive>
</template>
