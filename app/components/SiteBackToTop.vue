<script setup lang="ts">
import { useMediaQuery, useWindowScroll } from '@vueuse/core'

const { y } = useWindowScroll()
const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
const visible = computed(() => y.value > 560)

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: prefersReducedMotion.value ? 'auto' : 'smooth',
  })
}
</script>

<template>
  <Transition
    enter-active-class="transition duration-150 ease-out"
    enter-from-class="translate-y-3 opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition duration-100 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-3 opacity-0"
  >
    <div v-if="visible" class="site-back-to-top group fixed right-4 bottom-4 z-40 sm:right-6 sm:bottom-6">
      <button
        type="button"
        class="site-back-to-top__button inline-flex items-center justify-center"
        aria-label="返回顶部"
        @click="scrollToTop"
      >
        <Icon name="lucide:chevron-up" class="size-5" />
        <span class="site-back-to-top__label">TOP</span>
      </button>
      <span role="tooltip" class="site-back-to-top__tooltip">返回顶部</span>
    </div>
  </Transition>
</template>
