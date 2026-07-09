<script setup lang="ts">
import type { Component } from 'vue'
import type { useMouseState } from '~/composables/useMouseState'
import { inject, ref, watch } from 'vue'
import { cn } from '@/utils/cn'

interface Props {
  as?: string | Component
  class?: string
  translateX?: number | string
  translateY?: number | string
  translateZ?: number | string
  rotateX?: number | string
  rotateY?: number | string
  rotateZ?: number | string
}

const props = withDefaults(defineProps<Props>(), {
  as: 'div',
  class: '',
  translateX: 0,
  translateY: 0,
  translateZ: 0,
  rotateX: 0,
  rotateY: 0,
  rotateZ: 0,
})

const refElement = ref<HTMLElement | null>(null)
const mouseState = inject('use3DCardMouseState') as ReturnType<typeof useMouseState> | undefined

function toCssUnit(value: number | string, unit: 'px' | 'deg') {
  if (typeof value === 'number') {
    return `${value}${unit}`
  }

  return /^-?\d+(\.\d+)?$/.test(value) ? `${value}${unit}` : value
}

function handleAnimation(isMouseEntered: boolean) {
  if (!refElement.value) {
    return
  }

  refElement.value.style.transform = isMouseEntered
    ? [
      `translateX(${toCssUnit(props.translateX, 'px')})`,
      `translateY(${toCssUnit(props.translateY, 'px')})`,
      `translateZ(${toCssUnit(props.translateZ, 'px')})`,
      `rotateX(${toCssUnit(props.rotateX, 'deg')})`,
      `rotateY(${toCssUnit(props.rotateY, 'deg')})`,
      `rotateZ(${toCssUnit(props.rotateZ, 'deg')})`,
    ].join(' ')
    : 'translateX(0px) translateY(0px) translateZ(0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)'
}

watch(
  () => mouseState?.isMouseEntered.value ?? false,
  handleAnimation,
  { immediate: true },
)
</script>

<template>
  <component
    :is="props.as"
    ref="refElement"
    :class="cn('w-fit transition duration-500 ease-in-out', props.class)"
  >
    <slot />
  </component>
</template>
