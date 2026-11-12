<script setup lang="ts">
import type { ManagedArticleSummary } from '~~/shared/types/articles'
import { isPublicRouteEnabled } from '~~/shared/types/routes'
import { AppleCard, AppleCardCarousel, AppleCarouselItem } from '~/components/inspira/ui/apple-card-carousel'
import { showcaseSections } from '@/utils/siteSections'

definePageMeta({ layout: 'full-width' })
const { data: siteConfig } = await usePublicSiteConfig()
const { data: postsData } = await useFetch<{ articles: ManagedArticleSummary[] }>('/api/posts', {
  key: 'home-featured-posts',
  default: () => ({ articles: [] }),
})
const scene = useTemplateRef<{ rotate: (direction: number) => void }>('scene')
const activeView = ref(1)
const heroTitleLine1 = computed(() => siteConfig.value.site.homeHeroTitleLine1 || 'Hi，Kareshi')
const heroTitleLine2 = computed(() => siteConfig.value.site.homeHeroTitleLine2 ?? '继续唱。')
const heroLines = computed(() => [heroTitleLine1.value, heroTitleLine2.value].filter(Boolean))
const heroSubtitle = computed(() => siteConfig.value.site.homeHeroSubtitle || '星星在闪烁，你会怎么说。')
const sections = computed(() => showcaseSections.filter(section => isPublicRouteEnabled(siteConfig.value.routes, section.routeId)))
const postsVisible = computed(() => isPublicRouteEnabled(siteConfig.value.routes, 'posts'))
const articles = computed(() => (postsData.value?.articles || []).slice(0, 3))
const gallery = computed(() => siteConfig.value.gallery)
const galleryItems = computed(() => gallery.value.enabled ? gallery.value.items : [])

function rotate(direction: number) {
  scene.value?.rotate(direction)
  activeView.value = (activeView.value + direction + 3) % 3
}
function selectView(index: number) {
  scene.value?.rotate(index - activeView.value)
  activeView.value = index
}
useSeoMeta({
  title: () => siteConfig.value.seo.title || siteConfig.value.site.siteName,
  description: () => siteConfig.value.seo.description,
  keywords: () => siteConfig.value.seo.keywords,
})
</script>

<template>
  <div class="design-home">
    <section class="design-hero" aria-labelledby="home-title">
      <GlassHeroScene ref="scene" :lines="heroLines" />
      <h1 id="home-title" class="sr-only">{{ heroLines.join(' ') }}</h1>
      <div class="hero-interface">
        <div class="hero-arrows" aria-label="旋转冰块">
          <button class="design-arrow" type="button" aria-label="向左旋转" @click="rotate(-1)"><Icon name="lucide:arrow-left" /></button>
          <button class="design-arrow" type="button" aria-label="向右旋转" @click="rotate(1)"><Icon name="lucide:arrow-right" /></button>
        </div>
        <nav class="hero-dots" aria-label="方体视角">
          <button v-for="index in 3" :key="index" type="button" :aria-label="`视角 ${index}`" :aria-pressed="activeView === index - 1" :class="{ active: activeView === index - 1 }" @click="selectView(index - 1)" />
        </nav>
        <p class="hero-tagline">{{ heroSubtitle }}<strong>{{ siteConfig.site.siteName }}</strong></p>
        <div class="hero-cta-row">
          <a href="#chapters" class="design-cta">开始探索 <Icon name="lucide:arrow-up-right" /></a>
          <span class="hero-cta-line" />
          <span class="hero-count" aria-hidden="true">{{ String(sections.length).padStart(2, '0') }}</span>
        </div>
        <span class="hero-instruction">DRAG TO EXPLORE</span>
      </div>
    </section>

    <section id="chapters" class="home-section">
      <header class="section-topline"><span>01 / THE ARCHIVE</span><span>MAYDAY.LIFE</span></header>
      <div class="home-section-heading"><h2>一直唱。<br><span>一直记录。</span></h2><p>文章、收藏与相遇。<br>留住每一个值得重播的片刻。</p></div>
      <div class="section-directory">
        <NuxtLink v-for="(section, index) in sections" :key="section.path" :to="section.path">
          <span class="directory-number">{{ String(index + 1).padStart(2, '0') }}</span>
          <div><span class="directory-eyebrow">{{ section.eyebrow }}</span><h3>{{ section.title }}</h3></div>
          <Icon name="lucide:arrow-up-right" />
        </NuxtLink>
      </div>
    </section>

    <section v-if="postsVisible" class="home-section">
      <header class="section-topline"><span>02 / JOURNAL</span><NuxtLink to="/posts">全部文章 <Icon name="lucide:arrow-up-right" /></NuxtLink></header>
      <div class="home-section-heading"><h2>最近的<br><span>一些文字。</span></h2></div>
      <div v-if="articles.length" class="home-articles">
        <NuxtLink v-for="article in articles" :key="article.id" :to="article.path || `/detail/${article.slug}`" class="home-article">
          <div class="home-article-image"><img :src="article.coverImage || '/cover.jpg'" :alt="article.title" loading="lazy"><Icon name="lucide:arrow-up-right" /></div>
          <time>{{ String(article.updatedAt || article.createdAt).slice(0, 10) }}</time><h3>{{ article.title }}</h3><p>{{ article.summary || article.description }}</p>
        </NuxtLink>
      </div>
      <p v-else class="home-empty">还没有已发布的文章。</p>
    </section>

    <section v-if="galleryItems.length" id="gallery" class="home-section home-gallery">
      <header class="section-topline"><span>03 / GALLERY</span><span>{{ String(galleryItems.length).padStart(2, '0') }} MOMENTS</span></header>
      <div class="home-section-heading"><h2>{{ gallery.title }}</h2><p v-if="gallery.subtitle">{{ gallery.subtitle }}</p></div>
      <AppleCardCarousel :item-count="galleryItems.length"><AppleCarouselItem v-for="(item, index) in galleryItems" :key="item.id" :index="index"><AppleCard :card="item" :index="index" layout /></AppleCarouselItem></AppleCardCarousel>
    </section>

    <section class="home-section home-countdowns">
      <header class="section-topline"><span>04 / LOOKING FORWARD</span><Icon name="lucide:arrow-down-right" /></header>
      <div class="home-section-heading"><h2>下一次，<br><span>见面。</span></h2></div>
      <CountdownBoard />
    </section>
  </div>
</template>

<style scoped>
.design-home { background: #000; color: #fff; overflow: clip; }
.design-hero { position: relative; height: 100svh; min-height: 620px; background: #000; overflow: hidden; }
.hero-interface { position: absolute; z-index: 2; inset: 0; pointer-events: none; }
.hero-interface button, .hero-interface a { pointer-events: auto; }
.hero-arrows { position: absolute; top: 18.9%; left: 76.7%; display: flex; gap: 32px; transform: translate(-19px,-50%); }
.design-arrow { display: grid; place-items: center; width: 38px; height: 38px; border: 2px solid #fff; border-radius: 50%; color: #fff; background: transparent; transition: color .25s, background .25s; cursor: pointer; }
.design-arrow:hover { background: #fff; color: #000; }
.design-arrow .iconify { width: 18px; height: 18px; }
.hero-dots { position: absolute; right: calc(var(--site-pad) - 7px); top: 49.4%; transform: translateY(-50%); display: flex; flex-direction: column; gap: 33px; }
.hero-dots button { width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; background: white; cursor: pointer; transition: background .25s; }
.hero-dots button.active { background: transparent; }
.hero-tagline { position: absolute; left: var(--site-pad); bottom: clamp(40px, 7.5vh, 70px); max-width: 12em; font-size: clamp(22px, 2.45vw, 40px); font-weight: 300; line-height: 1.45; letter-spacing: -.03em; }
.hero-tagline strong { display: block; margin-top: .25em; font-weight: 600; }
.hero-cta-row { display: flex; align-items: center; position: absolute; left: 45.6%; right: -1vw; top: 88.7%; transform: translateY(-50%); }
.design-cta { display: inline-flex; flex: none; align-items: center; gap: 25px; min-height: 48px; padding: 0 18px; border: 1px solid #ffffffb3; border-radius: 6px; font-size: 13px; font-weight: 400; transition: background .25s, color .25s; }
.design-cta:hover { background: #fff; color: #000; }
.hero-cta-line { flex: 1; height: 1px; min-width: 40px; background: #ffffffb3; }
.hero-count { flex: none; font-size: clamp(140px, 19.8vw, 360px); line-height: 1; letter-spacing: -.05em; color: transparent; -webkit-text-stroke: 1px #ffffffd9; transform: translateY(6%); user-select: none; }
.hero-instruction { position: absolute; top: 72%; left: 50%; transform: translateX(-50%); color: #777; letter-spacing: .22em; font-size: 9px; white-space: nowrap; }
.home-section { padding: 80px var(--site-pad) 100px; scroll-margin-top: 80px; }
.section-topline { display: flex; justify-content: space-between; align-items: center; padding-top: 22px; border-top: 1px solid #333; color: #999; font-size: 10px; letter-spacing: .15em; }
.section-topline a { display: inline-flex; align-items: center; gap: 20px; color: white; letter-spacing: 0; }
.home-section-heading { display: flex; justify-content: space-between; align-items: end; gap: 35px; margin: 50px 0 65px; }
.home-section-heading h2 { font-size: clamp(36px, 5.4vw, 82px); font-weight: 500; line-height: 1.2; letter-spacing: -.06em; }
.home-section-heading h2 span { color: #777; }
.home-section-heading p { max-width: 320px; padding-bottom: 8px; color: #999; font-size: 13px; line-height: 2; }
.section-directory a { display: flex; align-items: center; gap: 45px; padding: 30px 0; border-bottom: 1px solid #282828; transition: padding .3s; }
.section-directory a:hover { padding-inline: 15px; }
.directory-number { align-self: start; color: #777; font-size: 12px; padding-top: 8px; }
.directory-eyebrow { color: #888; font-size: 10px; letter-spacing: .16em; }
.section-directory h3 { margin-top: 8px; font-size: clamp(24px, 3vw, 42px); font-weight: 400; letter-spacing: -.04em; }
.section-directory .iconify { margin-left: auto; width: 30px; height: 30px; }
.home-articles { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 28px; }
.home-article { min-width: 0; }
.home-article-image { position: relative; aspect-ratio: 4/3; background: #111; overflow: hidden; }
.home-article-image img { width: 100%; height: 100%; object-fit: cover; transition: transform .6s; }
.home-article:hover img { transform: scale(1.04); }
.home-article-image .iconify { position: absolute; bottom: 15px; right: 15px; width: 38px; height: 38px; padding: 9px; background: #000; border: 1px solid #ffffff80; border-radius: 50%; }
.home-article time { display: block; margin: 24px 0 12px; font-size: 10px; color: #888; letter-spacing: .1em; }
.home-article h3 { font-size: 22px; font-weight: 400; letter-spacing: -.04em; }
.home-article p { margin-top: 12px; color: #999; font-size: 12px; line-height: 1.9; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.home-empty { border-block: 1px solid #222; padding: 40px 0; color: #999; font-size: 13px; }
.home-gallery { padding-bottom: 0; }
.home-countdowns { padding-bottom: 120px; }
@media (max-width: 900px), (max-aspect-ratio: 1/1) {
  .hero-arrows { left: auto; right: var(--site-pad); top: 17%; transform: translateY(-50%); gap: 14px; }
  .hero-tagline { bottom: clamp(155px, 20vh, 220px); font-size: 25px; max-width: 12em; }
  .hero-cta-row { left: var(--site-pad); right: -3vw; top: auto; bottom: 24px; transform: none; }
  .hero-count { font-size: clamp(120px, 22vw, 200px); }
  .hero-instruction { top: 63%; }
  .home-articles { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 640px) {
  .design-hero { min-height: 740px; }
  .hero-dots { right: 18px; gap: 20px; }
  .hero-dots button { width: 10px; height: 10px; }
  .hero-tagline { bottom: 170px; font-size: 20px; max-width: 15em; }
  .hero-cta-row { right: -8vw; }
  .hero-count { font-size: 120px; }
  .hero-instruction { top: 64%; font-size: 8px; }
  .home-section { padding-block: 45px 65px; }
  .home-section-heading { margin-block: 35px 40px; flex-direction: column; align-items: start; gap: 20px; }
  .home-section-heading h2 { font-size: 42px; }
  .home-articles { grid-template-columns: 1fr; gap: 40px; }
  .section-directory a { gap: 25px; }
}
</style>
