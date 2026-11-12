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
  <div
    class="reading-layout"
    :class="{ 'reading-layout--with-toc': tocItems.length }"
  >
    <div ref="contentRef" class="reading-content">
      <slot />
    </div>

    <aside v-if="tocItems.length" class="reading-aside">
      <div class="reading-toc">
        <p class="reading-toc__label">ON THIS PAGE<span>目录</span></p>
        <nav class="reading-toc__links">
          <a
            v-for="item in tocItems"
            :key="item.id"
            :href="`#${item.id}`"
            class="reading-toc__link"
            :class="[
              item.level >= 3 ? 'reading-toc__link--nested' : '',
              activeHeadingId === item.id
                ? 'reading-toc__link--active'
                : '',
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
          class="reading-lightbox fixed inset-0 z-[95] flex touch-none items-center justify-center p-4"
          @click.self="closeLightbox"
          @wheel.prevent="handleLightboxWheel"
          @pointerdown="handleLightboxPointerDown"
          @pointermove="handleLightboxPointerMove"
          @pointerup="handleLightboxPointerEnd"
          @pointercancel="handleLightboxPointerEnd"
        >
          <button
            type="button"
            class="reading-control reading-lightbox__close absolute right-5 top-5"
            aria-label="关闭图片预览"
            @click="closeLightbox"
          >
            <Icon name="lucide:x" class="size-5" />
          </button>
          <img
            :src="lightboxImage.src"
            :alt="lightboxImage.alt"
            draggable="false"
            class="max-h-[88vh] max-w-[92vw] select-none object-contain transition-transform duration-100"
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
          class="reading-control reading-back-top fixed bottom-5 right-5 z-[90] md:bottom-8 md:right-8"
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
.reading-layout { display: grid; grid-template-columns: minmax(0, 52rem); justify-content: center; gap: clamp(3rem, 5vw, 5rem); }
.reading-content { min-width: 0; }
.reading-aside { display: none; }
.reading-toc { position: sticky; top: 7rem; padding-top: 1.4rem; border-top: 1px solid var(--border-strong); }
.reading-toc__label { display: flex; flex-direction: column; gap: .7rem; font-size: .55rem; font-weight: 500; letter-spacing: .16em; color: var(--text-muted); }
.reading-toc__label span { color: var(--text-primary); font-size: .8rem; letter-spacing: .05em; }
.reading-toc__links { margin-top: 1.5rem; max-height: calc(100svh - 14rem); overflow-y: auto; }
.reading-toc__link { display: block; margin-bottom: .3rem; border-left: 1px solid var(--border); padding: .5rem 0 .5rem 1rem; color: var(--text-muted); font-size: .72rem; line-height: 1.65; transition: color .2s, border-color .2s; }
.reading-toc__link:hover, .reading-toc__link--active { color: var(--text-primary); border-left-color: var(--text-primary); }
.reading-toc__link--nested { padding-left: 1.7rem; font-size: .66rem; }
.reading-lightbox { background: rgb(0 0 0 / 96%); }
.reading-control { display: flex; width: 2.75rem; height: 2.75rem; justify-content: center; align-items: center; border: 1px solid #656565; border-radius: 50%; color: #fff; background: #000; transition: background .2s, color .2s, transform .2s; }
.reading-control:hover { background: #fff; color: #000; transform: translateY(-2px); }
.reading-control:focus-visible { outline: 1px solid #fff; outline-offset: 5px; }
:deep(.blog-content) { color: var(--text-secondary); font-size: 1rem; line-height: 1.95; }
:deep(.blog-content > :first-child) { margin-top: 0; }
:deep(.blog-content h1), :deep(.blog-content h2), :deep(.blog-content h3), :deep(.blog-content h4) { font-weight: 400; line-height: 1.35; letter-spacing: -.035em; }
:deep(.blog-content h2) { margin-top: 3.5rem; margin-bottom: 1.5rem; font-size: clamp(1.75rem, 3vw, 2.5rem); }
:deep(.blog-content h3) { margin-top: 2.5rem; margin-bottom: 1rem; font-size: 1.45rem; }
:deep(.blog-content p) { margin-bottom: 1.5rem; }
:deep(.blog-content a) { border-bottom-color: var(--border-strong); text-underline-offset: .25em; }
:deep(.blog-content a:hover) { border-bottom-color: var(--text-primary); }
:deep(.blog-content blockquote) { margin-block: 2.5rem; padding: .2rem 0 .2rem 1.5rem; border-left: 1px solid var(--text-primary); border-radius: 0; background: transparent; color: var(--text-primary); font-size: 1.12rem; font-style: normal; font-weight: 300; }
:deep(.blog-content blockquote p:last-child) { margin-bottom: 0; }
:deep(.blog-content code) { border-color: var(--border); border-radius: 2px; background: var(--surface-low); font-size: .85em; }
:deep(.blog-content img) { width: auto; max-width: 100%; height: auto; margin-block: 2rem; border: 0; border-radius: 2px; box-shadow: none; }
:deep(.blog-content hr) { margin-block: 3rem; border-color: var(--border); }
:deep(.blog-content table) { display: block; max-width: 100%; overflow-x: auto; border-collapse: collapse; font-size: .85rem; }
:deep(.blog-content th), :deep(.blog-content td) { padding: .75rem 1rem; border: 1px solid var(--border); text-align: left; }
:deep(.article-code-shell) { margin: 2rem 0; overflow: hidden; border: 1px solid var(--border); border-radius: 3px; background: var(--surface-low); }
:deep(.article-code-shell pre) { margin: 0; padding: 1.25rem; border: 0; border-radius: 0; background: transparent; font-size: .8rem; line-height: 1.8; }
:deep(.article-code-shell pre code) { padding: 0; border: 0; background: transparent; }
:deep(.article-code-toolbar) { display: flex; align-items: center; gap: .75rem; border-bottom: 1px solid var(--border); padding: .65rem 1rem; }
:deep(.article-code-dots) { display: flex; gap: .3rem; }
:deep(.article-code-dots span) { width: .3rem; height: .3rem; border-radius: 50%; background: var(--text-muted); }
:deep(.article-code-language) { font-size: .55rem; font-weight: 500; letter-spacing: .14em; color: var(--text-muted); }
:deep(.article-code-copy) { margin-left: auto; padding: .2rem 0 .2rem .75rem; color: var(--text-secondary); font-size: .62rem; transition: color .2s; }
:deep(.article-code-copy:hover) { color: var(--text-primary); }
@media (min-width: 1280px) {
  .reading-layout--with-toc { grid-template-columns: minmax(0, 52rem) 12rem; justify-content: start; }
  .reading-aside { display: block; }
}
@media (max-width: 639px) {
  :deep(.blog-content) { font-size: .92rem; }
  :deep(.blog-content blockquote) { padding-left: 1rem; font-size: 1rem; }
}
</style>
