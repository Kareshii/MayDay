<script setup lang="ts">
import { AppleCarouselKey } from './AppleCarouselContext'

interface Props {
  initialScroll?: number
  itemCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  initialScroll: 0,
  itemCount: 0,
})

const carouselRef = ref<HTMLDivElement | null>(null)
const trackRef = ref<HTMLDivElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)
const currentIndex = ref(0)
const CARD_GAP = 8

function getVisibleCount(maxVisible: number) {
  return Math.max(1, Math.min(props.itemCount || 1, maxVisible))
}

function getCardBasis(maxVisible: number) {
  const count = getVisibleCount(maxVisible)
  const gapShare = CARD_GAP * (count - 1) / count

  return `calc(${100 / count}% - ${gapShare}px)`
}

function getHoverBasis(maxVisible: number) {
  const count = getVisibleCount(maxVisible)

  if (count === 1) {
    return getCardBasis(maxVisible)
  }

  const hoverWeight = 2.4
  const widthShare = hoverWeight / (count - 1 + hoverWeight) * 100

  return `${widthShare}%`
}

const trackStyle = computed(() => ({
  '--apple-card-basis-base': getCardBasis(1),
  '--apple-card-basis-sm': getCardBasis(2),
  '--apple-card-basis-lg': getCardBasis(3),
  '--apple-card-basis-xl': getCardBasis(4),
  '--apple-card-hover-base': getHoverBasis(1),
  '--apple-card-hover-sm': getHoverBasis(2),
  '--apple-card-hover-lg': getHoverBasis(3),
  '--apple-card-hover-xl': getHoverBasis(4),
}))

function getCarouselItems() {
  return Array.from(trackRef.value?.querySelectorAll<HTMLElement>(':scope > .apple-carousel-item') || [])
}

function getItemScrollPosition(item: HTMLElement) {
  const carousel = carouselRef.value

  if (!carousel) {
    return 0
  }

  return carousel.scrollLeft + item.getBoundingClientRect().left - carousel.getBoundingClientRect().left
}

function getTrackStartInset() {
  const carousel = carouselRef.value
  const track = trackRef.value

  if (!carousel || !track) {
    return 0
  }

  const trackWidth = track.getBoundingClientRect().width
  const trackPaddingLeft = Number.parseFloat(getComputedStyle(track).paddingLeft) || 0

  return Math.max((carousel.clientWidth - trackWidth) / 2, 0) + trackPaddingLeft
}

function getClosestItemIndex() {
  const carousel = carouselRef.value
  const items = getCarouselItems()

  if (!carousel || !items.length) {
    return 0
  }

  const anchorPosition = carousel.scrollLeft + getTrackStartInset()

  return items.reduce((closestIndex, item, index) => {
    const closestDistance = Math.abs(getItemScrollPosition(items[closestIndex]!) - anchorPosition)
    const itemDistance = Math.abs(getItemScrollPosition(item) - anchorPosition)

    return itemDistance < closestDistance ? index : closestIndex
  }, 0)
}

function checkScrollability() {
  const carousel = carouselRef.value
  if (!carousel) {
    return
  }

  const { scrollLeft, scrollWidth, clientWidth } = carousel
  canScrollLeft.value = scrollLeft > 0
  canScrollRight.value = scrollLeft < scrollWidth - clientWidth - 2
  currentIndex.value = getClosestItemIndex()
}

function scrollToIndex(index: number, behavior: ScrollBehavior = 'smooth') {
  const carousel = carouselRef.value
  const items = getCarouselItems()

  if (!carousel || !items.length) {
    return
  }

  const nextIndex = Math.min(Math.max(index, 0), items.length - 1)
  const target = items[nextIndex]

  if (!target) {
    return
  }

  currentIndex.value = nextIndex
  carousel.scrollTo({
    left: Math.max(getItemScrollPosition(target) - getTrackStartInset(), 0),
    behavior,
  })
}

function scrollByItem(direction: -1 | 1) {
  scrollToIndex(currentIndex.value + direction)
}

function handleCardClose(index: number) {
  scrollToIndex(index)
}

provide(AppleCarouselKey, {
  currentIndex,
  onCardClose: handleCardClose,
})

watch(() => props.initialScroll, (value) => {
  if (!carouselRef.value) {
    return
  }

  carouselRef.value.scrollLeft = value
  checkScrollability()
})

watch(() => props.itemCount, () => {
  void nextTick(checkScrollability)
})

onMounted(() => {
  if (carouselRef.value) {
    carouselRef.value.scrollLeft = props.initialScroll
  }

  void nextTick(checkScrollability)
  window.addEventListener('resize', checkScrollability)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkScrollability)
})
</script>

<template>
  <div class="relative w-full">
    <div
      ref="carouselRef"
      class="flex w-full overflow-x-auto overscroll-x-contain scroll-smooth py-8 [scrollbar-width:none] md:py-14"
      @scroll="checkScrollability"
    >
      <div class="pointer-events-none absolute right-0 top-0 z-10 h-full w-12 bg-linear-to-l from-[var(--bg-primary)] to-transparent md:w-28" />
      <div
        ref="trackRef"
        class="mx-auto flex w-full max-w-[96rem] flex-row justify-start gap-2 px-4 sm:px-6"
        :style="trackStyle"
      >
        <slot />
      </div>
    </div>

    <div class="mx-auto flex w-full max-w-[96rem] justify-end gap-2 px-4 sm:px-6">
      <button
        type="button"
        class="relative z-20 flex size-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-card)] text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] disabled:opacity-40"
        :disabled="!canScrollLeft"
        aria-label="向左滚动图册"
        title="上一张"
        @click="scrollByItem(-1)"
      >
        <Icon name="lucide:arrow-left" class="size-5" />
      </button>
      <button
        type="button"
        class="relative z-20 flex size-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-card)] text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] disabled:opacity-40"
        :disabled="!canScrollRight"
        aria-label="向右滚动图册"
        title="下一张"
        @click="scrollByItem(1)"
      >
        <Icon name="lucide:arrow-right" class="size-5" />
      </button>
    </div>
  </div>
</template>
