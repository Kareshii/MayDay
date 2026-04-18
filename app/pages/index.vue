<script setup lang="ts">
import type { DirectiveBinding } from 'vue'
import { useMediaQuery, useWindowScroll } from '@vueuse/core'
import { featuredShowcase, showcaseSections } from '@/utils/siteSections'
import { mojoItems } from '@/utils/mojoData'

definePageMeta({
  layout: 'full-width',
})

const { countdowns, quizQuestions } = useMaydayData()
const { y } = useWindowScroll()
const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

useSeoMeta({
  title: 'Hi,',
  description: '一个用 Vue 写成的五月天档案馆首页，把测验、文章、收藏和互动页面重新编排成 blog-next 风格。',
})

const statTargets = computed(() => [
  { label: 'SECTIONS', value: showcaseSections.length },
  { label: 'COUNTDOWNS', value: countdowns.value.length },
  { label: 'QUIZ', value: quizQuestions.value.length },
  { label: 'MOJOS', value: mojoItems.length },
])

const featuredSection = featuredShowcase ?? showcaseSections[0] ?? {
  path: '/',
  title: 'Mayday Archive',
  eyebrow: 'ARCHIVE',
  description: 'Archive overview',
  image: '/cover.jpg',
  badgeClass: 'border-white/20 bg-white/10 text-white/80',
  overlayClass: 'from-slate-950/88 via-slate-950/58 to-slate-950/30',
  cardClass: '',
}
const secondarySections = showcaseSections.filter(section => section.path !== featuredSection.path)

const heroImageStyle = computed(() => ({
  transform: prefersReducedMotion.value
    ? 'translate3d(0, 0, 0) scale(1.08)'
    : `translate3d(0, ${Math.min(y.value * 0.38, 220)}px, 0) scale(1.08)`,
}))

const rollCueInitial = {
  opacity: 0,
  y: 18,
}

const rollCueEnter = computed(() => (prefersReducedMotion.value
  ? {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0,
      },
    }
  : {
      opacity: 1,
      y: 0,
      transition: {
        duration: 680,
        delay: 980,
        ease: [0.22, 1, 0.36, 1],
      },
    }))

const animatedStats = ref(statTargets.value.map(() => 0))
let statsRaf = 0

function formatStat(value: number) {
  return value.toString().padStart(2, '0')
}

function animateStats() {
  const targets = statTargets.value.map(item => item.value)

  if (prefersReducedMotion.value) {
    animatedStats.value = [...targets]
    return
  }

  if (statsRaf) {
    cancelAnimationFrame(statsRaf)
  }

  const startedAt = performance.now()
  const duration = 1800

  const tick = (now: number) => {
    const progress = Math.min((now - startedAt) / duration, 1)
    const eased = 1 - (1 - progress) ** 3

    animatedStats.value = targets.map(target => Math.round(target * eased))

    if (progress < 1) {
      statsRaf = requestAnimationFrame(tick)
    }
  }

  statsRaf = requestAnimationFrame(tick)
}

const revealObservers = new WeakMap<HTMLElement, IntersectionObserver>()

const vReveal = {
  mounted(el: HTMLElement, binding: DirectiveBinding<number | { delay?: number }>) {
    const delay = typeof binding.value === 'number'
      ? binding.value
      : binding.value?.delay ?? 0

    el.style.setProperty('--reveal-delay', `${delay}ms`)

    if (prefersReducedMotion.value || typeof IntersectionObserver === 'undefined') {
      el.classList.add('is-visible')
      return
    }

    el.classList.add('reveal-on-scroll')

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          el.classList.add('is-visible')
          observer.unobserve(el)
        }
      },
      {
        threshold: 0.18,
        rootMargin: '0px 0px -10% 0px',
      },
    )

    observer.observe(el)
    revealObservers.set(el, observer)
  },
  unmounted(el: HTMLElement) {
    const observer = revealObservers.get(el)
    observer?.disconnect()
    revealObservers.delete(el)
  },
}

onMounted(() => {
  animateStats()
})

onBeforeUnmount(() => {
  if (statsRaf) {
    cancelAnimationFrame(statsRaf)
  }
})
</script>

<template>
  <div class="relative overflow-hidden">
    <section class="relative h-[100svh] overflow-hidden">
      <img
        src="/cover.jpg"
        alt="Mayday cover"
        class="hero-parallax-layer absolute inset-x-0 -top-[12%] h-[116%] w-full object-cover"
        :style="heroImageStyle"
      >
      <div class="hero-halo absolute inset-0" />
      <div class="absolute inset-0 bg-gradient-to-b from-slate-950/34 via-slate-950/72 to-[var(--bg-primary)]" />
      <div class="absolute inset-0 bg-[linear-gradient(115deg,rgba(56,189,248,0.12),transparent_28%,transparent_68%,rgba(244,114,182,0.1))]" />
      <div class="hero-grid absolute inset-0 opacity-35" />

      <div class="container relative z-10 flex h-full flex-col justify-center pt-28 pb-14 md:pt-36 md:pb-18">
        <div class="max-w-4xl space-y-6">
          <span class="hero-entrance inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-[0.24em] text-white/72 backdrop-blur-sm" style="--enter-delay: 60ms">
            <span class="size-1.5 rounded-full bg-white/60" />
            MAYDAY ARCHIVE
          </span>

          <h1 class="hero-entrance hero-title-glow max-w-4xl text-5xl font-semibold leading-[0.96] tracking-tight text-white md:text-7xl lg:text-[6.5rem]" style="--enter-delay: 180ms">
            <span class="glitch-text block" data-text="Hi，">Hi，</span>
            <span class="glitch-text mt-1 block" data-text="继续唱。">继续唱。</span>
          </h1>

          <div class="hero-entrance mt-7 space-y-2 text-white/80" style="--enter-delay: 320ms">
            <p class="text-xl font-medium md:text-2xl">
              星星在闪烁，你会怎么说。
            </p>
            <p class="max-w-2xl text-sm leading-7 text-white/64 md:text-base">
              把测验、文章、收集和互动页整理成一座能慢慢翻、慢慢点开的五月天档案馆。
              视觉骨架参考 blog-next，但首页入口已经收束到仍然保留的章节。
            </p>
          </div>

          <div class="mt-10 grid max-w-3xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div
              v-for="(item, index) in statTargets"
              :key="item.label"
              class="hero-entrance rounded-[1.6rem] border border-white/12 bg-white/7 px-5 py-5 backdrop-blur-sm"
              :style="{ '--enter-delay': `${420 + index * 90}ms` }"
            >
              <div class="text-4xl font-semibold tracking-tight text-white tabular-nums">
                {{ formatStat(animatedStats[index] ?? item.value) }}
              </div>
              <div class="mt-2 text-[11px] tracking-[0.28em] text-white/48">
                {{ item.label }}
              </div>
            </div>
          </div>

          <div class="hero-entrance mt-10 flex flex-wrap items-center gap-3" style="--enter-delay: 760ms">
            <NuxtLink
              to="/quiz"
              class="rounded-full bg-white px-7 py-3 text-sm font-semibold text-black transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/88"
            >
              开始五月天测验
            </NuxtLink>
            <NuxtLink
              to="/mojo"
              class="rounded-full border border-white/22 bg-white/10 px-7 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/18"
            >
              打开 Mojo Family
            </NuxtLink>
            <NuxtLink
              to="/balls"
              class="rounded-full border border-white/12 px-7 py-3 text-sm font-semibold text-white/80 transition-colors hover:text-white"
            >
              保留原本五球页面
            </NuxtLink>
          </div>
        </div>

        <a
          v-motion
          :initial="rollCueInitial"
          :enter="rollCueEnter"
          href="#chapters"
          class="home-roll-cue absolute bottom-7 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 text-xs tracking-[0.24em] text-white/58 transition-colors hover:text-white/78 md:bottom-9"
        >
          ROLL
          <Icon name="lucide:arrow-down" class="roll-arrow size-4" />
        </a>
      </div>
    </section>

    <section id="chapters" class="container relative z-10 min-h-[100svh] scroll-mt-18 pt-12 pb-20 md:pt-16 md:pb-28">
      <div v-reveal="40" class="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p class="section-kicker">RECENT SECTIONS</p>
          <h2 class="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-[var(--text-primary)] md:text-5xl">
            像读 blog-next 一样，翻开站里保留的章节。
          </h2>
        </div>
        <p class="max-w-md text-sm leading-7 text-[var(--text-secondary)]">
          这里不做传统博客列表，而是把站内仍然开放的主题页面和文章入口排成一组封面。
        </p>
      </div>

      <NuxtLink v-reveal="120" :to="featuredSection.path" class="group block">
        <article
          class="overflow-hidden rounded-[2rem] border border-white/12 bg-slate-950 text-white shadow-[0_40px_100px_-48px_rgba(15,23,42,0.88)] transition-all duration-300"
          :class="featuredSection.cardClass"
        >
          <div class="relative min-h-[420px] md:min-h-[520px]">
            <img
              :src="featuredSection.image"
              :alt="featuredSection.title"
              class="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            >
            <div class="absolute inset-0 bg-gradient-to-r" :class="featuredSection.overlayClass" />
            <div class="absolute inset-x-0 bottom-0 p-7 md:p-10">
              <span
                class="inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.24em]"
                :class="featuredSection.badgeClass"
              >
                {{ featuredSection.eyebrow }}
              </span>
              <h3 class="mt-4 max-w-2xl text-3xl font-semibold tracking-tight md:text-5xl">
                {{ featuredSection.title }}
              </h3>
              <p class="mt-3 max-w-2xl text-sm leading-7 text-white/72 md:text-base">
                {{ featuredSection.description }}
              </p>
              <div class="mt-6 inline-flex items-center gap-2 text-sm font-medium text-white">
                打开这一章
                <Icon name="lucide:arrow-up-right" class="size-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </div>
            </div>
          </div>
        </article>
      </NuxtLink>

      <div class="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <NuxtLink
          v-for="(section, index) in secondarySections"
          :key="section.path"
          v-reveal="{ delay: 160 + index * 90 }"
          :to="section.path"
          class="group block"
        >
          <article
            class="overflow-hidden rounded-[1.8rem] border border-[var(--border)] bg-[var(--card)] shadow-[0_24px_64px_-52px_rgba(15,23,42,0.45)] transition-all duration-300"
            :class="section.cardClass"
          >
            <div class="relative aspect-[4/3] overflow-hidden bg-slate-950">
              <img
                :src="section.image"
                :alt="section.title"
                class="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              >
              <div class="absolute inset-0 bg-gradient-to-t" :class="section.overlayClass" />
              <div class="absolute inset-x-0 bottom-0 p-5 text-white">
                <span
                  class="inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold tracking-[0.22em]"
                  :class="section.badgeClass"
                >
                  {{ section.eyebrow }}
                </span>
                <h3 class="mt-3 text-2xl font-semibold tracking-tight">
                  {{ section.title }}
                </h3>
              </div>
            </div>
            <div class="p-6">
              <p class="text-sm leading-7 text-[var(--text-secondary)]">
                {{ section.description }}
              </p>
              <div class="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                继续阅读
                <Icon name="lucide:arrow-right" class="size-4 transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </div>
          </article>
        </NuxtLink>
      </div>
    </section>

    <section class="container pb-24 md:pb-32">
      <div class="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div v-reveal="60" class="surface-card p-8 md:p-10">
          <p class="section-kicker">COUNTDOWN</p>
          <h2 class="mt-3 text-3xl font-semibold tracking-tight text-[var(--text-primary)] md:text-4xl">
            重要日期，还在这里等你。
          </h2>
          <p class="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
            旧首页里的倒计时模块没有删除，只是换到一个更安静、更像杂志内页的位置继续存在。
          </p>

          <div class="mt-8">
            <CountdownBoard />
          </div>
        </div>

        <div class="space-y-6">
          <div v-reveal="180" class="surface-card space-y-4 p-8">
            <p class="section-kicker">NOTE</p>
            <blockquote class="border-l-2 border-[var(--border-strong)] pl-4 text-lg leading-8 text-[var(--text-primary)]">
              “无垠的蓝色年代，相伴的每一秒钟，分离的每一滴泪，都陪你穿越二十多年。”
            </blockquote>
            <p class="text-sm leading-7 text-[var(--text-secondary)]">
              首页不再只是 markdown 内容输出，而是一张完整的入口海报。原来的内容语气仍然留在这里。
            </p>
          </div>

          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
            <NuxtLink
              v-reveal="260"
              to="/mojo"
              class="surface-card block p-7 transition-transform duration-300 hover:-translate-y-1"
            >
              <p class="section-kicker">COLLECTION</p>
              <h3 class="mt-3 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                Mojo Family
              </h3>
              <p class="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                收集页保留原本的乐趣，但现在和首页卡片系统在视觉上更统一。
              </p>
            </NuxtLink>

            <NuxtLink
              v-reveal="340"
              to="/balls"
              class="surface-card block p-7 transition-transform duration-300 hover:-translate-y-1"
            >
              <p class="section-kicker">ORIGINAL PAGE</p>
              <h3 class="mt-3 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                五球盲盒
              </h3>
              <p class="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                用户要求保留原本的 balls 页面，所以它没有被做成新的文章模版，而是继续保持独立互动页。
              </p>
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
