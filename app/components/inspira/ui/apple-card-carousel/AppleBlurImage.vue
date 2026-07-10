<script setup lang="ts">
import { cn } from '@/utils/cn'

interface Props {
  height?: number | string
  width?: number | string
  src: string
  class?: string
  alt?: string
  fill?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  height: undefined,
  width: undefined,
  class: '',
  alt: '',
  fill: false,
})

const isLoading = ref(true)

function handleLoad() {
  isLoading.value = false
}
</script>

<template>
  <img
    :src="props.src"
    :width="props.width"
    :height="props.height"
    loading="lazy"
    decoding="async"
    :alt="props.alt"
    :class="cn(
      'transition duration-300',
      isLoading ? 'blur-sm' : 'blur-0',
      props.fill ? 'h-full w-full' : '',
      props.class,
    )"
    @load="handleLoad"
  >
</template>
