<script setup lang="ts">
/**
 * Document driven is removed in Content v3.
 * This page is a simple/full-feature replacement of document driven.
 */
import { getSiteSection, showcaseSections } from '@/utils/siteSections'

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
const relatedSections = computed(() => showcaseSections.filter(item => item.path !== route.path).slice(0, 4))
const heroImage = computed(() => section.value?.image || page.value?.coverImage || '/cover.jpg')
const heroBadge = computed(() => section.value?.badgeClass || 'border-white/20 bg-white/10 text-white/72')
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
  <article class="container">
    <header class="overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--card)] shadow-[0_32px_80px_-58px_rgba(15,23,42,0.5)]">
      <div class="grid gap-6 p-6 md:p-10 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)] xl:items-end">
        <div>
          <p class="section-kicker">
            {{ section?.eyebrow || 'ARCHIVE ENTRY' }}
          </p>
          <h1 class="mt-4 text-4xl font-semibold tracking-tight text-[var(--text-primary)] md:text-6xl">
            {{ page?.title }}
          </h1>
          <p
            v-if="pageDescription"
            class="mt-5 max-w-2xl text-base leading-8 text-[var(--text-secondary)]"
          >
            {{ pageDescription }}
          </p>

          <div class="mt-8 flex flex-wrap items-center gap-3 text-xs font-medium tracking-[0.18em] text-[var(--text-secondary)]">
            <span class="rounded-full border border-[var(--border)] px-3 py-2">
              {{ route.path }}
            </span>
            <span class="rounded-full border border-[var(--border)] px-3 py-2">
              {{ pageNavigationTitle }}
            </span>
          </div>
        </div>

        <div class="relative aspect-[4/3] overflow-hidden rounded-[1.6rem] bg-slate-950">
          <img
            :src="heroImage"
            :alt="page?.title || ''"
            class="absolute inset-0 h-full w-full object-cover"
          >
          <div class="absolute inset-0 bg-gradient-to-t from-black/88 via-black/28 to-transparent" />
          <div class="absolute inset-x-0 bottom-0 p-6 text-white">
            <span
              class="inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold tracking-[0.22em]"
              :class="heroBadge"
            >
              {{ heroLabel }}
            </span>
            <p class="mt-4 text-sm leading-7 text-white/68">
              {{ heroSummary }}
            </p>
          </div>
        </div>
      </div>
    </header>

    <div class="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_16rem]">
      <div class="surface-card space-y-8 p-6 md:p-10">
        <div
          v-if="pageDescription"
          class="rounded-[1.4rem] border-l-4 border-black/70 bg-black/[0.035] p-5 text-lg leading-8 text-[var(--text-secondary)] dark:border-white/70 dark:bg-white/[0.035]"
        >
          {{ pageDescription }}
        </div>

        <ContentRenderer
          v-if="page"
          :value="page"
          class="blog-content"
        />
      </div>

      <aside class="hidden xl:block">
        <div class="sticky top-28 space-y-3 rounded-[1.6rem] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_24px_64px_-52px_rgba(15,23,42,0.42)]">
          <p class="section-kicker">EXPLORE</p>
          <NuxtLink
            v-for="item in relatedSections"
            :key="item.path"
            :to="item.path"
            class="group block rounded-[1.25rem] border border-transparent px-4 py-4 transition-all hover:border-[var(--border)] hover:bg-black/[0.025] dark:hover:bg-white/[0.03]"
          >
            <p class="text-xs font-semibold tracking-[0.18em] text-[var(--text-secondary)]">
              {{ item.eyebrow }}
            </p>
            <p class="mt-2 text-base font-semibold text-[var(--text-primary)]">
              {{ item.title }}
            </p>
            <p class="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              {{ item.description }}
            </p>
          </NuxtLink>
        </div>
      </aside>
    </div>
  </article>
</template>
