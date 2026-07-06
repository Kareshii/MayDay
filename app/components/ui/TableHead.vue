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
    as="th"
    :class="cn('h-12 px-4 py-3 align-middle font-semibold', props.class)"
  >
    <slot />
  </Primitive>
</template>
