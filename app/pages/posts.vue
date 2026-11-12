<script setup lang="ts">
import type { ManagedArticleSummary } from '~~/shared/types/articles'
import type { RouteLocationRaw } from 'vue-router'

definePageMeta({
  layout: 'default',
})

useSeoMeta({
  title: '文章',
  description: '这里展示后台发布的文章列表。',
})

const articleRequest = useFetch<{ articles: ManagedArticleSummary[] }>('/api/posts', {
  key: 'public-posts-list',
  default: () => ({ articles: [] }),
  lazy: import.meta.client,
})

if (import.meta.server) {
  await articleRequest
}

const { data, pending } = articleRequest
const allPages = computed(() => data.value?.articles || [])
const isLoading = computed(() => pending.value && !allPages.value.length)

function getArticleDetailRoute(slug: string): RouteLocationRaw {
  return {
    name: 'detail-slug',
    params: { slug },
  }
}
</script>

<template>
  <section class="public-posts-page container journal-page">
    <header class="journal-heading">
      <div class="journal-heading__top">
        <p class="journal-eyebrow">THE JOURNAL / 文章与记录</p>
        <span class="journal-total">{{ String(allPages.length).padStart(2, '0') }} ENTRIES</span>
      </div>
      <div class="journal-heading__title">
        <h1>文章<span>Articles.</span></h1>
        <p>把此刻写下来。<br>让故事，继续发生。</p>
      </div>
    </header>

    <div v-if="isLoading" class="journal-list" aria-label="正在加载文章">
      <div v-for="skeleton in 3" :key="`post-skeleton-${skeleton}`" class="journal-entry journal-entry--loading">
        <span class="journal-entry__number">{{ String(skeleton).padStart(2, '0') }}</span>
        <div class="journal-entry__image animate-pulse bg-[var(--surface-low)]" />
        <div class="space-y-5 py-3">
          <div class="h-3 w-24 animate-pulse bg-[var(--surface-low)]" />
          <div class="h-8 w-4/5 animate-pulse bg-[var(--surface-low)]" />
          <div class="h-4 w-full animate-pulse bg-[var(--surface-low)]" />
          <div class="h-4 w-2/3 animate-pulse bg-[var(--surface-low)]" />
        </div>
      </div>
    </div>

    <div v-else-if="allPages.length" class="journal-list">
      <NuxtLink
        v-for="(page, index) in allPages"
        :key="page.id"
        :to="getArticleDetailRoute(page.slug)"
        class="journal-entry group"
      >
        <span class="journal-entry__number">{{ String(index + 1).padStart(2, '0') }}</span>
        <div class="journal-entry__image">
          <img :src="page.coverImage || '/cover.jpg'" :alt="page.title">
          <span v-if="page.pinned" class="journal-entry__pinned"><Icon name="lucide:pin" class="size-3" />置顶</span>
        </div>
        <div class="journal-entry__content">
          <p class="journal-entry__date">{{ String(page.updatedAt || page.createdAt || '').slice(0, 10) }}</p>
          <h2>{{ page.title }}</h2>
          <p class="journal-entry__summary">{{ page.summary || page.description || '暂无摘要。' }}</p>
          <span class="journal-entry__read">阅读文章 <Icon name="lucide:arrow-up-right" class="size-4" /></span>
        </div>
        <Icon name="lucide:arrow-up-right" class="journal-entry__arrow" />
      </NuxtLink>
    </div>

    <p v-else class="journal-empty">还没有已发布的文章。先去管理页新建一篇吧。</p>
  </section>
</template>

<style scoped>
.journal-page { padding-top: clamp(3rem, 7vw, 7rem); padding-bottom: clamp(4rem, 8vw, 8rem); }
.journal-heading { margin-bottom: clamp(3rem, 6vw, 6rem); }
.journal-heading__top { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--border); }
.journal-eyebrow, .journal-total, .journal-entry__date, .journal-entry__number { color: var(--text-muted); font-size: .65rem; font-weight: 500; letter-spacing: .14em; }
.journal-heading__title { display: flex; justify-content: space-between; align-items: flex-end; gap: 2rem; margin-top: 2.2rem; }
.journal-heading h1 { color: var(--text-primary); font-size: clamp(4rem, 10vw, 9rem); font-weight: 500; line-height: .95; letter-spacing: -.065em; }
.journal-heading h1 span { display: block; margin-top: .2em; font-size: .58em; font-weight: 300; letter-spacing: -.045em; }
.journal-heading__title > p { padding-bottom: .3rem; color: var(--text-secondary); font-size: .82rem; line-height: 1.9; }
.journal-entry { display: grid; grid-template-columns: 2.5rem minmax(0, .85fr) minmax(0, 1.2fr) 1.75rem; gap: clamp(1.25rem, 3.5vw, 3.5rem); align-items: center; padding-block: clamp(2rem, 4vw, 4rem); border-top: 1px solid var(--border); }
.journal-entry:last-child { border-bottom: 1px solid var(--border); }
.journal-entry__number { align-self: start; padding-top: .2rem; }
.journal-entry__image { position: relative; aspect-ratio: 4 / 3; overflow: hidden; background: var(--surface-low); }
.journal-entry__image img { width: 100%; height: 100%; object-fit: cover; filter: grayscale(1); transition: filter .4s, transform .6s; }
.journal-entry:hover .journal-entry__image img { filter: grayscale(0); transform: scale(1.035); }
.journal-entry__pinned { position: absolute; top: .8rem; left: .8rem; display: inline-flex; align-items: center; gap: .4rem; padding: .35rem .5rem; background: #000; color: #fff; font-size: .62rem; }
.journal-entry__content { min-width: 0; }
.journal-entry h2 { margin-block: 1rem; color: var(--text-primary); font-size: clamp(1.5rem, 2.7vw, 2.75rem); font-weight: 400; line-height: 1.3; letter-spacing: -.035em; overflow-wrap: anywhere; }
.journal-entry__summary { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; color: var(--text-secondary); font-size: .85rem; line-height: 1.9; }
.journal-entry__read { display: inline-flex; gap: .7rem; align-items: center; margin-top: 1.75rem; padding-bottom: .35rem; border-bottom: 1px solid var(--border-strong); color: var(--text-primary); font-size: .72rem; }
.journal-entry__arrow { width: 1.6rem; height: 1.6rem; align-self: start; color: var(--text-primary); transition: transform .25s; }
.journal-entry:hover .journal-entry__arrow { transform: translate(3px, -3px); }
.journal-entry:focus-visible { outline: 1px solid var(--text-primary); outline-offset: 8px; }
.journal-empty { padding-block: 4rem; border-block: 1px solid var(--border); color: var(--text-secondary); font-size: .9rem; }
@media (max-width: 767px) {
  .journal-heading__title { align-items: flex-start; flex-direction: column; }
  .journal-heading__title > p { font-size: .75rem; }
  .journal-entry { grid-template-columns: 1.5rem minmax(0, 1fr); gap: 1rem; }
  .journal-entry__content { grid-column: 2; padding-top: .4rem; }
  .journal-entry__arrow { display: none; }
  .journal-entry__image { aspect-ratio: 16 / 10; }
  .journal-entry h2 { font-size: 1.65rem; }
  .journal-total { font-size: .58rem; white-space: nowrap; }
}
</style>
