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
    as="tr"
    :class="cn('transition hover:bg-[var(--surface-high)]', props.class)"
  >
    <slot />
  </Primitive>
</template>
