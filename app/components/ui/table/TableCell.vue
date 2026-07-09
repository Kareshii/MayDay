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
    as="td"
    :class="cn('px-4 py-2', props.class)"
  >
    <slot />
  </Primitive>
</template>
