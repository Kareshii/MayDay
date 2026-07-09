<script setup lang="ts">
import type { DirectiveBinding } from 'vue'
import type { ManagedArticleSummary } from '~~/shared/types/articles'
import { useMediaQuery, useWindowScroll } from '@vueuse/core'
import { CardBody, CardContainer, CardItem } from '~/components/inspira/ui/card-3d'
import { featuredShowcase, showcaseSections } from '@/utils/siteSections'
import { mojoItems } from '@/utils/mojoData'

interface PublicSiteSettings {
  siteName: string
  homeHeroImage: string
  homeHeroTitleLine1: string
  homeHeroTitleLine2: string
  homeHeroSubtitle: string
}

interface PublicSeoSettings {
  title: string
  description: string
  keywords: string
}

interface PublicSiteResponse {
  site: PublicSiteSettings
  seo: PublicSeoSettings
}

definePageMeta({
  layout: 'full-width',
})

const { countdowns } = useMaydayData()
const { y } = useWindowScroll()
const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
const { data: siteConfig } = await useFetch<PublicSiteResponse>('/api/site', {
  key: 'public-site-config',
  default: () => ({
    site: {
      siteName: 'mayday.life',
      homeHeroImage: '/cover.jpg',
      homeHeroTitleLine1: 'Hi，Kareshi',
      homeHeroTitleLine2: '继续唱。',
      homeHeroSubtitle: '星星在闪烁，你会怎么说。',
    },
    seo: {
      title: 'Hi,',
      description: '一个用 Vue 写成的五月天档案馆首页，把文章、收藏和互动页面重新编排成 blog-next 风格。',
      keywords: 'mayday, 五月天, blog',
    },
  }),
})

const { data: postsData } = await useFetch<{ articles: ManagedArticleSummary[] }>('/api/posts', {
  key: 'home-featured-posts',
  default: () => ({ articles: [] }),
})

const heroTitleLine1 = computed(() => siteConfig.value.site.homeHeroTitleLine1 || 'Hi，Kareshi')
const heroTitleLine2 = computed(() => siteConfig.value.site.homeHeroTitleLine2 ?? '继续唱。')
const heroSubtitle = computed(() => siteConfig.value.site.homeHeroSubtitle || '星星在闪烁，你会怎么说。')
const heroImage = computed(() => siteConfig.value.site.homeHeroImage || '/cover.jpg')

useSeoMeta({
  title: () => siteConfig.value.seo.title || siteConfig.value.site.siteName || 'Hi,',
  description: () => siteConfig.value.seo.description || '一个用 Vue 写成的五月天档案馆首页，把文章、收藏和互动页面重新编排成 blog-next 风格。',
  keywords: () => siteConfig.value.seo.keywords,
})

const statTargets = computed(() => [
  { label: 'SECTIONS', value: showcaseSections.length },
  { label: 'COUNTDOWNS', value: countdowns.value.length },
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
const homeArticles = computed(() => (postsData.value?.articles || []).slice(0, 3))

function getArticleRoute(article: ManagedArticleSummary) {
  return article.path || `/detail/${article.slug}`
}

function getArticleCover(article: ManagedArticleSummary) {
  return article.coverImage || '/cover.jpg'
}

function getArticleSummary(article: ManagedArticleSummary) {
  return article.summary || article.description || '暂无摘要。'
}

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
        :src="heroImage"
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


          <h1 class="mt-4 hero-entrance hero-title-glow max-w-4xl text-5xl font-semibold leading-[0.96] tracking-tight text-white md:text-7xl lg:text-[6.5rem]" style="--enter-delay: 180ms">
            <span class="glitch-text block" :data-text="heroTitleLine1">{{ heroTitleLine1 }}</span>
            <span v-if="heroTitleLine2" class="glitch-text mt-1 block" :data-text="heroTitleLine2">{{ heroTitleLine2 }}</span>
          </h1>

          <div class="hero-entrance mt-7 space-y-2 text-white/80" style="--enter-delay: 320ms">
            <p class="text-xl font-medium md:text-2xl">
              {{ heroSubtitle }}
            </p>
          </div>

        </div>

        <a
          v-motion
          :initial="rollCueInitial"
          :enter="rollCueEnter"
          href="#chapters"
          class="home-roll-cue absolute bottom-7 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 text-xs tracking-[0.24em] text-white/58 transition-colors hover:text-white/78 md:bottom-9"
        >
          <Icon name="lucide:arrow-down" class="roll-arrow size-4" />
        </a>
      </div>
    </section>

    <section id="chapters" class="relative z-10 mx-auto min-h-[100svh] w-full max-w-[96rem] scroll-mt-18 px-4 pt-12 pb-20 sm:px-6 md:pt-16 md:pb-28">
      <div v-reveal="120" class="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p class="section-kicker flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
            <Icon name="lucide:book-open-text" class="size-4" />
            POSTS
          </p>
          <h2 class="mt-4 text-3xl font-bold tracking-tight text-[var(--text-primary)] md:text-5xl">
            文章
          </h2>
        </div>

        <NuxtLink
          to="/posts"
          class="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--surface-card)] px-5 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-500/50 hover:text-cyan-600 dark:hover:text-cyan-300"
        >
          查看全部
          <Icon name="lucide:arrow-right" class="size-4" />
        </NuxtLink>
      </div>

      <div
        v-if="homeArticles.length"
        class="mt-8 grid gap-6 lg:grid-cols-2 2xl:grid-cols-3"
      >
        <NuxtLink
          v-for="(article, index) in homeArticles"
          :key="article.id"
          v-reveal="{ delay: 180 + index * 90 }"
          :to="getArticleRoute(article)"
          class="group/article block focus:outline-none"
        >
          <CardContainer container-class="h-full">
            <CardBody class="group/card relative h-auto w-full max-w-[30rem] rounded-xl border border-black/10 bg-gray-50 p-6 transition-colors duration-300 group-hover/article:border-cyan-500/40 sm:w-[30rem] dark:border-white/20 dark:bg-black dark:hover:shadow-2xl dark:hover:shadow-emerald-500/10">
              <CardItem
                :translate-z="50"
                class="line-clamp-1 w-full text-xl font-bold text-neutral-600 dark:text-white"
              >
                {{ article.title }}
              </CardItem>

              <CardItem
                as="p"
                :translate-z="60"
                class="mt-2 line-clamp-1 w-full max-w-sm text-sm text-neutral-500 dark:text-neutral-300"
              >
                {{ getArticleSummary(article) }}
              </CardItem>

              <CardItem
                :translate-z="100"
                class="mt-4 w-full"
              >
                <img
                  :src="getArticleCover(article)"
                  :alt="article.title"
                  class="h-60 w-full rounded-xl object-cover group-hover/card:shadow-xl"
                  width="1000"
                  height="1000"
                >
              </CardItem>

              <div class="mt-12 flex items-center justify-between" style="transform-style: preserve-3d;">
                <CardItem
                  :translate-z="20"
                  as="span"
                  class="rounded-xl px-4 py-2 text-xs font-normal text-neutral-700 dark:text-white"
                >
                  阅读文章 →
                </CardItem>
              </div>
            </CardBody>
          </CardContainer>
        </NuxtLink>
      </div>

      <div
        v-else
        v-reveal="180"
        class="mt-8 rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-card)] p-8 text-sm text-[var(--text-secondary)]"
      >
        还没有已发布的文章。
      </div>

      <div class="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <NuxtLink
          v-for="(section, index) in secondarySections"
          :key="section.path"
          v-reveal="{ delay: 160 + index * 90 }"
          :to="section.path"
          class="group block"
        >
          <article
            class="surface-card relative flex h-full flex-col overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:border-[var(--border-strong)] hover:shadow-[0_24px_64px_-12px_rgba(15,23,42,0.15)] dark:hover:shadow-[0_24px_64px_-12px_rgba(255,255,255,0.05)]"
            :class="section.cardClass"
          >
            <div class="relative aspect-[4/3] w-full overflow-hidden">
              <img
                :src="section.image"
                :alt="section.title"
                class="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              >
              <div class="absolute inset-0 bg-gradient-to-t" :class="section.overlayClass || 'from-black/60 to-transparent'" />
              <div class="absolute inset-x-0 bottom-0 p-6 text-white">
                <h3 class="mt-3.5 text-2xl font-bold tracking-tight drop-shadow-md">
                  {{ section.title }}
                </h3>
              </div>
            </div>
            <div class="flex flex-1 flex-col justify-between p-6">
              <p class="text-sm leading-relaxed text-[var(--text-secondary)]">
                {{ section.description }}
              </p>
              <div class="inline-flex items-center gap-2 text-sm font-bold text-[var(--text-primary)] transition-colors group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
                继续阅读
                <Icon name="lucide:arrow-right" class="size-4 transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </div>
          </article>
        </NuxtLink>
      </div>
    </section>

    <section class="container pb-24 md:pb-32">
      <div class="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <!-- Countdown Module (Static Hover Glow) -->
        <div v-reveal="60" class="surface-card group relative overflow-hidden p-8 transition-all duration-700 hover:border-cyan-500/30 hover:shadow-xl dark:hover:border-cyan-500/20 md:p-10">
          <div class="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-cyan-500/5 blur-3xl transition-colors duration-700 group-hover:bg-cyan-500/10"/>
          
          <p class="section-kicker relative z-10 flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
            <Icon name="lucide:timer" class="size-4" /> 
            COUNTDOWN
          </p>
          <div class="relative z-10 mt-8">
            <CountdownBoard />
          </div>
        </div>

        <div class="space-y-6">
          <!-- NOTE Module (Static Hover Glow) -->
          <div v-reveal="180" class="surface-card group relative overflow-hidden p-8 transition-all duration-700 hover:border-purple-500/30 hover:shadow-xl dark:hover:border-purple-500/20">
            <div class="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-purple-500/5 blur-3xl transition-colors duration-700 group-hover:bg-purple-500/10"/>
            
            <p class="section-kicker relative z-10 flex items-center gap-2 text-purple-600 dark:text-purple-400">
              <Icon name="lucide:quote" class="size-4" /> 
              NOTE
            </p>
            <blockquote class="relative z-10 mt-5 rounded-r-xl border-l-4 border-purple-500/40 bg-purple-500/5 py-4 pl-5 text-lg font-medium leading-relaxed text-[var(--text-primary)] transition-colors duration-700 group-hover:border-purple-500/60 dark:border-purple-400/50 dark:bg-purple-500/10">
              “无垠的蓝色年代，相伴的每一秒钟，分离的每一滴泪，都陪你穿越二十多年。”
            </blockquote>
            <p class="relative z-10 mt-5 text-sm leading-relaxed text-[var(--text-secondary)]">
              首页不再只是 markdown 内容输出，而是一张完整的入口海报。原来的内容语气仍然留在这里。
            </p>
          </div>

          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
            <!-- Mojo Module (Interactive Link) -->
            <NuxtLink
              v-reveal="260"
              to="/mojo"
              class="surface-card group relative block overflow-hidden p-7 transition-all duration-500 hover:-translate-y-1 hover:border-amber-500/40 hover:shadow-2xl dark:hover:border-amber-500/30"
            >
              <div class="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-amber-500/5 blur-3xl transition-colors duration-700 group-hover:bg-amber-500/15"/>
              
              <div class="absolute right-6 top-6 text-amber-500/0 transition-all duration-500 ease-out group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-amber-500/80">
                <Icon name="lucide:arrow-up-right" class="size-5" />
              </div>

              <p class="section-kicker relative z-10 flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <Icon name="lucide:sparkles" class="size-4" /> 
                COLLECTION
              </p>
              <h3 class="relative z-10 mt-4 text-2xl font-bold tracking-tight text-[var(--text-primary)] transition-colors duration-300 group-hover:text-amber-600 dark:group-hover:text-amber-400">
                Mojo Family
              </h3>
              <p class="relative z-10 mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                收集页保留原本的乐趣，但现在和首页卡片系统在视觉上更统一。
              </p>
            </NuxtLink>

            <!-- Original Page Module (Interactive Link) -->
            <NuxtLink
              v-reveal="340"
              to="/balls"
              class="surface-card group relative block overflow-hidden p-7 transition-all duration-500 hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-2xl dark:hover:border-blue-500/30"
            >
              <div class="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-blue-500/5 blur-3xl transition-colors duration-700 group-hover:bg-blue-500/15"/>
              
              <div class="absolute right-6 top-6 text-blue-500/0 transition-all duration-500 ease-out group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-blue-500/80">
                <Icon name="lucide:arrow-up-right" class="size-5" />
              </div>

              <p class="section-kicker relative z-10 flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Icon name="lucide:box" class="size-4" /> 
                ORIGINAL PAGE
              </p>
              <h3 class="relative z-10 mt-4 text-2xl font-bold tracking-tight text-[var(--text-primary)] transition-colors duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                五球盲盒
              </h3>
              <p class="relative z-10 mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                用户要求保留原本的 balls 页面，所以它没有被做成新的文章模版，而是继续保持独立互动页。
              </p>
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
