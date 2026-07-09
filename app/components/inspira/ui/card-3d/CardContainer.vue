<script setup lang="ts">
import { provide, useTemplateRef } from 'vue'
import { cn } from '@/utils/cn'
import { useMouseState } from '~/composables/useMouseState'

interface Props {
  class?: string
  containerClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  class: '',
  containerClass: '',
})

const containerRef = useTemplateRef<HTMLElement>('containerRef')
const mouseState = useMouseState()
provide('use3DCardMouseState', mouseState)

function handleMouseMove(event: MouseEvent) {
  if (!containerRef.value) {
    return
  }

  const { left, top, width, height } = containerRef.value.getBoundingClientRect()
  const x = (event.clientX - left - width / 2) / 25
  const y = (event.clientY - top - height / 2) / 25
  containerRef.value.style.transform = `rotateY(${x}deg) rotateX(${y}deg)`
}

function handleMouseEnter() {
  mouseState.setMouseEntered(true)
}

function handleMouseLeave() {
  if (!containerRef.value) {
    return
  }

  mouseState.setMouseEntered(false)
  containerRef.value.style.transform = 'rotateY(0deg) rotateX(0deg)'
}
</script>

<template>
  <div
    :class="cn('flex items-center justify-center p-2', props.containerClass)"
    style="perspective: 1000px;"
  >
    <div
      ref="containerRef"
      :class="cn('relative flex items-center justify-center transition-all duration-200 ease-linear', props.class)"
      style="transform-style: preserve-3d;"
      @mouseenter="handleMouseEnter"
      @mousemove="handleMouseMove"
      @mouseleave="handleMouseLeave"
    >
      <slot />
    </div>
  </div>
</template>
