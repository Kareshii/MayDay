<script setup lang="ts">
import { Primitive } from 'reka-ui'
import { cn } from '@/utils/cn'

interface Props {
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <div class="w-full overflow-x-auto">
    <Primitive
      as="table"
      :class="cn('w-full caption-bottom text-left text-sm', props.class)"
    >
      <slot />
    </Primitive>
  </div>
</template>
