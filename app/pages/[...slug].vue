<script setup lang="ts">
/**
 * Document driven is removed in Content v3.
 * This page is a simple/full-feature replacement of document driven.
 */
import ArticleReadingEnhancer from '@/components/posts/ArticleReadingEnhancer.vue'
import { getSiteSection } from '@/utils/siteSections'

const route = useRoute()

const { data: page } = await useAsyncData(`page-${route.params.slug}`, () => {
  return queryCollection('content').path(route.path).first()
})

if (!page.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page not found',
  })
}

const section = computed(() => getSiteSection(route.path))
const pageDescription = computed(() => page.value?.seo?.description || page.value?.description || '')
const heroImage = computed(() => section.value?.image || page.value?.coverImage || '/cover.jpg')
const heroLabel = computed(() => section.value?.navTitle || 'MAYDAY')
const heroSummary = computed(() => section.value?.description || pageDescription.value)
const pageNavigationTitle = computed(() => {
  const navigation = page.value?.navigation
  return typeof navigation === 'object' && navigation && 'title' in navigation
    ? navigation.title
    : page.value?.title
})

useSeoMeta({
  title: () => page.value?.seo?.title || page.value?.title,
  description: () => pageDescription.value,
  ogImage: () => heroImage.value,
})
</script>

<template>
  <article class="public-content-page container archive-page">
    <header class="archive-header">
      <div class="archive-header__label"><span>{{ section?.eyebrow || 'ARCHIVE ENTRY' }}</span><span>{{ route.path }}</span></div>
      <div class="archive-header__grid">
        <div class="archive-header__copy">
          <h1>{{ page?.title }}</h1>
          <p v-if="pageDescription" class="archive-description">{{ pageDescription }}</p>
          <div class="archive-caption"><span>{{ pageNavigationTitle }}</span><Icon name="lucide:arrow-down-right" class="size-5" /></div>
        </div>
        <figure class="archive-cover">
          <img :src="heroImage" :alt="page?.title || ''">
          <figcaption><span>{{ heroLabel }}</span><p>{{ heroSummary }}</p></figcaption>
        </figure>
      </div>
    </header>

    <ArticleReadingEnhancer :content-key="route.path">
      <p v-if="pageDescription" class="archive-intro">{{ pageDescription }}</p>
      <ContentRenderer v-if="page" :value="page" class="blog-content" />
    </ArticleReadingEnhancer>
  </article>
</template>

<style scoped>
.archive-page { padding-top: clamp(3rem, 7vw, 7rem); padding-bottom: 5rem; }
.archive-header { margin-bottom: clamp(4rem, 8vw, 8rem); }
.archive-header__label { display: flex; justify-content: space-between; gap: 1rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--border); color: var(--text-muted); font-size: .65rem; font-weight: 500; letter-spacing: .15em; }
.archive-header__label > span:last-child { letter-spacing: .03em; }
.archive-header__grid { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, .85fr); gap: clamp(2rem, 6vw, 6rem); align-items: center; padding-top: clamp(2.5rem, 5vw, 5rem); }
.archive-header__copy h1 { color: var(--text-primary); font-size: clamp(3rem, 7vw, 6.5rem); line-height: 1.15; font-weight: 400; letter-spacing: -.055em; overflow-wrap: anywhere; }
.archive-description { max-width: 32rem; margin-top: 2rem; color: var(--text-secondary); font-size: .95rem; line-height: 2; }
.archive-caption { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-top: 3rem; padding-block: 1.25rem; border-block: 1px solid var(--border); color: var(--text-muted); font-size: .68rem; letter-spacing: .06em; }
.archive-cover { min-width: 0; }
.archive-cover > img { display: block; width: 100%; aspect-ratio: 4 / 5; object-fit: cover; filter: grayscale(1); }
.archive-cover figcaption { display: grid; grid-template-columns: auto 1fr; gap: 1.5rem; padding-top: 1rem; color: var(--text-muted); font-size: .62rem; line-height: 1.8; }
.archive-cover figcaption > span { font-weight: 500; letter-spacing: .12em; }
.archive-intro { margin-bottom: 3rem; padding-bottom: 2rem; border-bottom: 1px solid var(--border); color: var(--text-primary); font-size: clamp(1.15rem, 2.2vw, 1.65rem); font-weight: 300; line-height: 1.85; }
@media (max-width: 767px) {
  .archive-header__grid { grid-template-columns: minmax(0, 1fr); }
  .archive-cover > img { aspect-ratio: 16 / 10; }
  .archive-header__label { font-size: .56rem; letter-spacing: .1em; }
}
</style>
