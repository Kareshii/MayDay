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
    as="tbody"
    :class="cn('divide-y divide-[var(--border-soft)]', props.class)"
  >
    <slot />
  </Primitive>
</template>
