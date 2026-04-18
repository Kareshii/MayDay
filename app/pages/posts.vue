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
  <section class="container">
    <div class="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p class="section-kicker">POSTS</p>
        <h1 class="mt-3 text-4xl font-semibold tracking-tight text-[var(--text-primary)] md:text-5xl">
          文章
        </h1>
      </div>
      <p class="max-w-xl text-sm leading-7 text-[var(--text-secondary)]">
        这里汇总通过管理页创建并发布的文章。
      </p>
    </div>

    <div v-if="isLoading" class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      <div
        v-for="skeleton in 3"
        :key="`post-skeleton-${skeleton}`"
        class="overflow-hidden rounded-[1.8rem] border border-[var(--border)] bg-[var(--card)]"
      >
        <div class="aspect-[4/3] animate-pulse bg-[var(--surface-low)]" />
        <div class="space-y-3 p-6">
          <div class="h-4 w-2/5 animate-pulse rounded bg-[var(--surface-low)]" />
          <div class="h-5 w-4/5 animate-pulse rounded bg-[var(--surface-low)]" />
          <div class="h-4 w-full animate-pulse rounded bg-[var(--surface-low)]" />
          <div class="h-4 w-3/4 animate-pulse rounded bg-[var(--surface-low)]" />
        </div>
      </div>
    </div>

    <div v-else-if="allPages?.length" class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      <NuxtLink
        v-for="page in allPages"
        :key="page.id"
        :to="getArticleDetailRoute(page.slug)"
        class="group block overflow-hidden rounded-[1.8rem] border border-[var(--border)] bg-[var(--card)] shadow-[0_24px_64px_-52px_rgba(15,23,42,0.45)] transition-all duration-300 hover:-translate-y-1"
      >
        <div class="relative aspect-[4/3] overflow-hidden bg-slate-950">
          <img
            :src="page.coverImage || '/cover.jpg'"
            :alt="page.title"
            class="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          >
          <div class="absolute inset-0 bg-gradient-to-t from-black/88 via-black/18 to-transparent" />
          <div class="absolute inset-x-0 bottom-0 p-5 text-white">
            <p class="text-xs font-semibold tracking-[0.2em] text-white/54">
              {{ String(page.updatedAt || page.createdAt || '').slice(0, 10) }}
            </p>
            <h2 class="mt-2 text-2xl font-semibold tracking-tight">
              {{ page.title }}
            </h2>
          </div>
        </div>

        <div class="p-6">
          <p class="line-clamp-3 text-sm leading-7 text-[var(--text-secondary)]">
            {{ page.summary || page.description || '暂无摘要。' }}
          </p>
          <div class="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
            阅读文章
            <Icon name="lucide:arrow-right" class="size-4 transition-transform duration-200 group-hover:translate-x-1" />
          </div>
        </div>
      </NuxtLink>
    </div>

    <div
      v-else
      class="surface-card px-6 py-12 text-center text-sm text-[var(--text-secondary)]"
    >
      还没有已发布的文章。先去管理页新建一篇吧。
    </div>
  </section>
</template>
