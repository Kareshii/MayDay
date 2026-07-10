<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import type { HomeGalleryItem } from '~~/shared/types/gallery'
import { AppleCarouselKey } from './AppleCarouselContext'
import AppleBlurImage from './AppleBlurImage.vue'

interface Props {
  card: HomeGalleryItem
  index: number
  layout?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  layout: false,
})

const open = ref(false)
const containerRef = ref<HTMLElement | null>(null)
const carouselContext = inject(AppleCarouselKey)
let previousBodyOverflow = ''

if (!carouselContext) {
  throw new Error('AppleCard must be used within AppleCardCarousel')
}

const detailImages = computed(() => {
  return Array.from(new Set([props.card.image, ...props.card.images]
    .map(image => image.trim())
    .filter(Boolean)))
})

function handleOpen() {
  open.value = true
}

function handleClose() {
  open.value = false
  carouselContext.onCardClose(props.index)
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape' && open.value) {
    handleClose()
  }
}

watch(open, (value) => {
  if (!import.meta.client) {
    return
  }

  if (value) {
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = previousBodyOverflow
  }
})

onClickOutside(containerRef, () => {
  if (open.value) {
    handleClose()
  }
})

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  if (open.value) {
    document.body.style.overflow = previousBodyOverflow
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-[90] h-screen overflow-y-auto px-4 py-6"
      >
        <div class="fixed inset-0 bg-black/80 backdrop-blur-lg" />
        <article
          ref="containerRef"
          class="relative z-[91] mx-auto my-4 max-w-5xl rounded-3xl border border-white/10 bg-white p-4 shadow-[0_40px_120px_-48px_rgba(0,0,0,0.82)] md:p-10 dark:bg-neutral-950"
        >
          <button
            type="button"
            class="sticky top-4 right-0 z-10 ml-auto flex size-9 items-center justify-center rounded-full bg-black text-white transition hover:scale-105 dark:bg-white dark:text-neutral-950"
            aria-label="关闭图册详情"
            @click="handleClose"
          >
            <Icon name="lucide:x" class="size-5" />
          </button>

          <p class="text-base font-semibold text-neutral-950 dark:text-white">
            {{ props.card.category }}
          </p>
          <h3 class="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-neutral-800 md:text-5xl dark:text-white">
            {{ props.card.title }}
          </h3>
          <p class="mt-5 max-w-2xl text-sm leading-7 text-neutral-600 md:text-base dark:text-neutral-300">
            {{ props.card.description }}
          </p>

          <div class="py-8 md:py-10">
            <div
              v-if="detailImages.length"
              class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            >
              <div
                v-for="(image, imageIndex) in detailImages"
                :key="`${image}-${imageIndex}`"
                class="relative aspect-[4/3] overflow-hidden rounded-xl bg-neutral-100 dark:bg-white/8"
              >
                <img
                  :src="image"
                  :alt="props.card.title"
                  class="absolute inset-0 h-full w-full object-cover"
                >
              </div>
            </div>

            <div
              v-if="props.card.content"
              class="mt-8 rounded-2xl bg-neutral-100 p-5 text-sm leading-8 text-neutral-700 md:p-6 md:text-base dark:bg-white/8 dark:text-neutral-200"
            >
              {{ props.card.content }}
            </div>
          </div>
        </article>
      </div>
    </Transition>
  </Teleport>

  <button
    type="button"
    class="group relative z-10 flex h-80 w-full cursor-pointer flex-col items-start justify-start overflow-hidden rounded-3xl bg-gray-100 text-left shadow-[0_28px_90px_-58px_rgba(15,23,42,0.75)] outline-none transition-transform duration-300 hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] md:h-[40rem] dark:bg-neutral-900"
    @click="handleOpen"
  >
    <div class="pointer-events-none absolute inset-x-0 top-0 z-30 h-full bg-linear-to-b from-black/58 via-black/12 to-black/34" />
    <AppleBlurImage
      :src="props.card.image || detailImages[0] || '/cover.jpg'"
      :alt="props.card.title"
      class="absolute inset-0 z-10 object-cover transition-transform duration-700 group-hover:scale-105"
      :fill="true"
    />
    <div class="pointer-events-none relative z-40 p-7 md:p-8">
      <p class="text-sm font-semibold text-white/86 md:text-base">
        {{ props.card.category }}
      </p>
      <h3 class="mt-2 max-w-xs text-xl font-semibold text-balance text-white md:text-3xl">
        {{ props.card.title }}
      </h3>
      <p class="mt-3 line-clamp-2 max-w-xs text-xs leading-6 text-white/72 md:text-sm">
        {{ props.card.description }}
      </p>
    </div>
  </button>
</template>
