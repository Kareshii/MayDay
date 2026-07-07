<script setup lang="ts">
interface TocItem {
  id: string
  text: string
  level: number
}

interface LightboxImage {
  src: string
  alt: string
}

const props = defineProps<{
  contentKey: string
}>()

const contentRef = useTemplateRef<HTMLElement>('contentRef')
const tocItems = ref<TocItem[]>([])
const activeHeadingId = ref('')
const lightboxImage = ref<LightboxImage | null>(null)
const lightboxScale = ref(1)
const lightboxOffset = reactive({ x: 0, y: 0 })
const lightboxTransform = computed(() => `translate3d(${lightboxOffset.x}px, ${lightboxOffset.y}px, 0) scale(${lightboxScale.value})`)
const backTopVisible = ref(false)
let observer: IntersectionObserver | null = null
let cleanupHandlers: Array<() => void> = []
let backTopTarget: HTMLElement | Window | null = null
let cleanupBackTopScroll: (() => void) | null = null
const pointerPositions = new Map<number, { x: number, y: number }>()
let panStart = { x: 0, y: 0 }
let panOffsetStart = { x: 0, y: 0 }
let pinchStartDistance = 0
let pinchStartScale = 1

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    || 'section'
}

function getCodeLanguage(code: HTMLElement | null) {
  const className = code?.className || ''
  const matched = String(className).match(/language-([\w-]+)/)
  return matched?.[1]?.toUpperCase() || 'CODE'
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function resetLightboxTransform() {
  lightboxScale.value = 1
  lightboxOffset.x = 0
  lightboxOffset.y = 0
  pointerPositions.clear()
  pinchStartDistance = 0
}

function openLightbox(image: HTMLImageElement) {
  resetLightboxTransform()
  lightboxImage.value = {
    src: image.currentSrc || image.src,
    alt: image.alt || '',
  }
}

function closeLightbox() {
  lightboxImage.value = null
  resetLightboxTransform()
}

function getPointerDistance() {
  const points = Array.from(pointerPositions.values())
  const first = points[0]
  const second = points[1]

  if (!first || !second) {
    return 0
  }

  return Math.hypot(first.x - second.x, first.y - second.y)
}

function handleLightboxWheel(event: WheelEvent) {
  const delta = event.deltaY > 0 ? -0.22 : 0.22
  lightboxScale.value = clamp(lightboxScale.value + delta, 1, 4)

  if (lightboxScale.value === 1) {
    lightboxOffset.x = 0
    lightboxOffset.y = 0
  }
}

function handleLightboxPointerDown(event: PointerEvent) {
  const target = event.currentTarget
  if (target instanceof HTMLElement) {
    target.setPointerCapture?.(event.pointerId)
  }

  pointerPositions.set(event.pointerId, { x: event.clientX, y: event.clientY })

  if (pointerPositions.size === 1) {
    panStart = { x: event.clientX, y: event.clientY }
    panOffsetStart = { x: lightboxOffset.x, y: lightboxOffset.y }
  }

  if (pointerPositions.size === 2) {
    pinchStartDistance = getPointerDistance()
    pinchStartScale = lightboxScale.value
  }
}

function handleLightboxPointerMove(event: PointerEvent) {
  if (!pointerPositions.has(event.pointerId)) {
    return
  }

  pointerPositions.set(event.pointerId, { x: event.clientX, y: event.clientY })

  if (pointerPositions.size >= 2 && pinchStartDistance > 0) {
    lightboxScale.value = clamp((getPointerDistance() / pinchStartDistance) * pinchStartScale, 1, 4)
    if (lightboxScale.value === 1) {
      lightboxOffset.x = 0
      lightboxOffset.y = 0
    }
    return
  }

  if (lightboxScale.value > 1) {
    lightboxOffset.x = panOffsetStart.x + event.clientX - panStart.x
    lightboxOffset.y = panOffsetStart.y + event.clientY - panStart.y
  }
}

function handleLightboxPointerEnd(event: PointerEvent) {
  const target = event.currentTarget
  if (target instanceof HTMLElement) {
    target.releasePointerCapture?.(event.pointerId)
  }

  pointerPositions.delete(event.pointerId)
  pinchStartDistance = 0

  const remainingPoint = Array.from(pointerPositions.values())[0]
  if (remainingPoint) {
    panStart = remainingPoint
    panOffsetStart = { x: lightboxOffset.x, y: lightboxOffset.y }
  }
}

function toggleLightboxZoom() {
  if (lightboxScale.value > 1) {
    resetLightboxTransform()
    return
  }

  lightboxScale.value = 2
}

function getScrollParent(element: HTMLElement) {
  let parent = element.parentElement

  while (parent && parent !== document.body) {
    const style = window.getComputedStyle(parent)
    const canScroll = /(auto|scroll|overlay)/.test(style.overflowY)

    if (canScroll && parent.scrollHeight > parent.clientHeight) {
      return parent
    }

    parent = parent.parentElement
  }

  return window
}

function getScrollTop(target: HTMLElement | Window) {
  return target === window ? window.scrollY : (target as HTMLElement).scrollTop
}

function updateBackTopVisibility() {
  if (!backTopTarget) {
    backTopVisible.value = false
    return
  }

  backTopVisible.value = getScrollTop(backTopTarget) > 480
}

function cleanupBackTop() {
  cleanupBackTopScroll?.()
  cleanupBackTopScroll = null
  backTopTarget = null
  backTopVisible.value = false
}

async function setupBackTop() {
  await nextTick()
  cleanupBackTop()

  const root = contentRef.value
  if (!root || !import.meta.client) {
    return
  }

  backTopTarget = getScrollParent(root)
  backTopTarget.addEventListener('scroll', updateBackTopVisibility, { passive: true })
  cleanupBackTopScroll = () => {
    backTopTarget?.removeEventListener('scroll', updateBackTopVisibility)
  }
  updateBackTopVisibility()
}

function scrollBackToTop() {
  const target = backTopTarget || window

  target.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
}

function cleanupEnhancements() {
  observer?.disconnect()
  observer = null
  cleanupHandlers.forEach(handler => handler())
  cleanupHandlers = []
}

function enhanceHeadings(root: HTMLElement) {
  const headings = Array.from(root.querySelectorAll<HTMLElement>('h2, h3, h4'))
  const usedIds = new Map<string, number>()
  tocItems.value = headings.map((heading) => {
    const text = heading.textContent?.trim() || '未命名章节'
    const baseId = heading.id || slugify(text)
    const count = usedIds.get(baseId) || 0
    const id = count ? `${baseId}-${count + 1}` : baseId
    usedIds.set(baseId, count + 1)
    heading.id = id
    heading.style.scrollMarginTop = '7rem'

    return {
      id,
      text,
      level: Number(heading.tagName.slice(1)),
    }
  })

  activeHeadingId.value = tocItems.value[0]?.id || ''

  if (!tocItems.value.length || !('IntersectionObserver' in window)) {
    return
  }

  observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter(entry => entry.isIntersecting)
      .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top)[0]

    if (visible?.target.id) {
      activeHeadingId.value = visible.target.id
    }
  }, {
    rootMargin: '-18% 0px -66%',
    threshold: [0, 1],
  })

  headings.forEach(heading => observer?.observe(heading))
}

function enhanceImages(root: HTMLElement) {
  const images = Array.from(root.querySelectorAll<HTMLImageElement>('img'))

  images.forEach((image) => {
    image.classList.add('cursor-zoom-in')
    const handler = () => {
      openLightbox(image)
    }

    image.addEventListener('click', handler)
    cleanupHandlers.push(() => image.removeEventListener('click', handler))
  })
}

function enhanceCodeBlocks(root: HTMLElement) {
  const blocks = Array.from(root.querySelectorAll<HTMLPreElement>('pre'))

  blocks.forEach((pre) => {
    if (pre.dataset.enhanced === 'true') {
      return
    }

    pre.dataset.enhanced = 'true'
    const code = pre.querySelector<HTMLElement>('code')
    const shell = document.createElement('div')
    const toolbar = document.createElement('div')
    const dots = document.createElement('div')
    const label = document.createElement('span')
    const copyButton = document.createElement('button')

    shell.className = 'article-code-shell'
    toolbar.className = 'article-code-toolbar'
    dots.className = 'article-code-dots'
    dots.innerHTML = '<span></span><span></span><span></span>'
    label.className = 'article-code-language'
    label.textContent = getCodeLanguage(code)
    copyButton.type = 'button'
    copyButton.className = 'article-code-copy'
    copyButton.textContent = '复制'

    const copyHandler = async () => {
      try {
        await navigator.clipboard?.writeText(code?.textContent || pre.textContent || '')
        copyButton.textContent = '已复制'
      } catch {
        copyButton.textContent = '复制失败'
      }

      window.setTimeout(() => {
        copyButton.textContent = '复制'
      }, 1200)
    }

    copyButton.addEventListener('click', copyHandler)
    cleanupHandlers.push(() => copyButton.removeEventListener('click', copyHandler))

    toolbar.append(dots, label, copyButton)
    pre.before(shell)
    shell.append(toolbar, pre)
  })
}

async function enhanceArticle() {
  await nextTick()
  cleanupEnhancements()

  const root = contentRef.value
  if (!root) {
    return
  }

  enhanceHeadings(root)
  enhanceImages(root)
  enhanceCodeBlocks(root)
}

watch(() => props.contentKey, () => {
  void enhanceArticle()
  void setupBackTop()
}, { immediate: true, flush: 'post' })

onMounted(() => {
  void enhanceArticle()
  void setupBackTop()
})

onBeforeUnmount(() => {
  cleanupEnhancements()
  cleanupBackTop()
  resetLightboxTransform()
})
</script>

<template>
  <div class="grid gap-8 xl:grid-cols-[minmax(0,1fr)_16rem]">
    <div ref="contentRef" class="surface-card p-6 md:p-10">
      <slot />
    </div>

    <aside v-if="tocItems.length" class="hidden xl:block">
      <div class="sticky top-20 rounded-[4px 4px 0 0] border border-[var(--border)] bg-[color:var(--card)]/[0.82] p-5 shadow-[0_24px_64px_-52px_rgba(15,23,42,0.42)] backdrop-blur-xl">
        <p class="section-kicker">目录</p>
        <nav class="mt-4 space-y-1">
          <a
            v-for="item in tocItems"
            :key="item.id"
            :href="`#${item.id}`"
            class="block rounded-lg px-3 py-2 text-sm leading-5 transition-colors"
            :class="[
              item.level >= 3 ? 'ml-3 text-xs' : '',
              activeHeadingId === item.id
                ? 'bg-[var(--primary-soft)] text-[var(--text-primary)]'
                : 'text-[var(--text-secondary)] hover:bg-black/5 hover:text-[var(--text-primary)] dark:hover:bg-white/[0.08]',
            ]"
          >
            {{ item.text }}
          </a>
        </nav>
      </div>
    </aside>

    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-[180ms] ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-[120ms] ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="lightboxImage"
          role="dialog"
          aria-modal="true"
          aria-label="图片预览"
          class="fixed inset-0 z-[95] flex touch-none items-center justify-center bg-black/[0.82] p-4 backdrop-blur-xl"
          @click.self="closeLightbox"
          @wheel.prevent="handleLightboxWheel"
          @pointerdown="handleLightboxPointerDown"
          @pointermove="handleLightboxPointerMove"
          @pointerup="handleLightboxPointerEnd"
          @pointercancel="handleLightboxPointerEnd"
        >
          <button
            type="button"
            class="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full border border-white/[0.15] bg-white/10 text-white shadow-[0_18px_40px_-24px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-colors hover:bg-white/[0.18]"
            aria-label="关闭图片预览"
            @click="closeLightbox"
          >
            <Icon name="lucide:x" class="size-5" />
          </button>
          <img
            :src="lightboxImage.src"
            :alt="lightboxImage.alt"
            draggable="false"
            class="max-h-[88vh] max-w-[92vw] select-none rounded-[1.2rem] object-contain shadow-[0_32px_100px_-36px_rgba(0,0,0,0.9)] transition-transform duration-100"
            :style="{ transform: lightboxTransform }"
            @click.stop
            @dblclick.stop="toggleLightboxZoom"
          >
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="translate-y-2 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="translate-y-2 opacity-0"
      >
        <button
          v-if="backTopVisible"
          type="button"
          class="fixed bottom-5 right-5 z-[90] flex size-11 items-center justify-center rounded-full border border-[var(--border)] bg-[color:var(--card)]/[0.9] text-[var(--text-primary)] shadow-[0_18px_50px_-34px_rgba(15,23,42,0.72)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-[var(--surface-low)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] md:bottom-8 md:right-8"
          aria-label="回到顶部"
          title="回到顶部"
          @click="scrollBackToTop"
        >
          <Icon name="lucide:arrow-up" class="size-5" />
        </button>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
:deep(.article-code-shell) {
  margin: 1.5rem 0;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 1.1rem;
  background: rgba(15, 23, 42, 0.055);
}

:global(.dark) :deep(.article-code-shell) {
  background: rgba(255, 255, 255, 0.045);
}

:deep(.article-code-shell pre) {
  margin: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
}

:deep(.article-code-toolbar) {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-bottom: 1px solid var(--border);
  padding: 0.65rem 0.8rem;
}

:deep(.article-code-dots) {
  display: flex;
  gap: 0.35rem;
}

:deep(.article-code-dots span) {
  width: 0.65rem;
  height: 0.65rem;
  border-radius: 9999px;
}

:deep(.article-code-dots span:nth-child(1)) {
  background: #ff5f57;
}

:deep(.article-code-dots span:nth-child(2)) {
  background: #ffbd2e;
}

:deep(.article-code-dots span:nth-child(3)) {
  background: #28c840;
}

:deep(.article-code-language) {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: var(--text-secondary);
}

:deep(.article-code-copy) {
  margin-left: auto;
  border: 1px solid var(--border);
  border-radius: 9999px;
  padding: 0.28rem 0.62rem;
  color: var(--text-secondary);
  font-size: 0.72rem;
  font-weight: 700;
  transition: background 160ms ease, color 160ms ease;
}

:deep(.article-code-copy:hover) {
  background: var(--surface-low);
  color: var(--text-primary);
}
</style>
