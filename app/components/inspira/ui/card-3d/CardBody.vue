<script setup lang="ts">
import { cn } from '@/utils/cn'

interface Props {
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  class: '',
})
</script>

<template>
  <div
    :class="cn('h-96 w-96', props.class)"
    style="transform-style: preserve-3d;"
  >
    <slot />
  </div>
</template>
