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
  <section class="container max-w-xl">
    <div v-if="isLoading" class="mt-8 flex flex-col gap-6 md:gap-8">
      <div
        v-for="skeleton in 3"
        :key="`post-skeleton-${skeleton}`"
        class="flex min-h-[24rem] flex-col overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--card)] md:min-h-[28rem] md:flex-row"
        :class="skeleton % 2 === 0 ? 'md:flex-row-reverse' : ''"
      >
        <div class="aspect-[16/9] w-full shrink-0 animate-pulse bg-[var(--surface-low)] md:aspect-auto md:w-5/12 lg:w-[45%]" />
        <div class="flex w-full flex-col justify-center space-y-4 p-6 md:p-8 lg:p-10">
          <div class="h-4 w-1/4 animate-pulse rounded bg-[var(--surface-low)]" />
          <div class="h-8 w-3/4 animate-pulse rounded bg-[var(--surface-low)]" />
          <div class="h-4 w-full animate-pulse rounded bg-[var(--surface-low)]" />
          <div class="h-4 w-5/6 animate-pulse rounded bg-[var(--surface-low)]" />
        </div>
      </div>
    </div>

    <div v-else-if="allPages?.length" class="mt-8 flex flex-col gap-6 md:gap-8">
      <NuxtLink
        v-for="(page, index) in allPages"
        :key="page.id"
        :to="getArticleDetailRoute(page.slug)"
        class="group flex min-h-[24rem] flex-col overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--card)] shadow-[0_12px_40px_-24px_rgba(15,23,42,0.3)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl md:min-h-[28rem] md:flex-row"
        :class="index % 2 === 1 ? 'md:flex-row-reverse' : ''"
      >
        <!-- Image Half -->
        <div class="relative aspect-[16/9] w-full shrink-0 overflow-hidden bg-slate-950 md:aspect-auto md:w-4/12 lg:w-[45%]">
          <img
            :src="page.coverImage || '/cover.jpg'"
            :alt="page.title"
            class="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          >
          <div class="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          
          <div class="absolute left-6 top-6">
            <span
              v-if="page.pinned"
              class="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-3 py-1.5 text-[11px] font-semibold tracking-[0.2em] text-white backdrop-blur-md"
            >
              <Icon name="lucide:pin" class="size-3" />
              置顶
            </span>
          </div>
        </div>

        <!-- Content Half -->
        <div class="flex w-full flex-col justify-center space-y-4 p-6 md:p-8 lg:p-10">
          <p class="text-xs font-semibold tracking-[0.2em] text-[var(--text-secondary)]">
            {{ String(page.updatedAt || page.createdAt || '').slice(0, 10) }}
          </p>
          
          <h2 class="text-2xl font-semibold tracking-tight text-[var(--text-primary)] transition-colors duration-200 group-hover:text-[var(--primary)] md:text-3xl">
            {{ page.title }}
          </h2>

          <p class="line-clamp-3 text-sm leading-7 text-[var(--text-secondary)] md:text-base md:leading-8">
            {{ page.summary || page.description || '暂无摘要。' }}
          </p>

          <div class="pt-2">
            <span class="inline-flex items-center gap-2 text-sm font-semibold tracking-wider text-[var(--text-primary)] transition-colors duration-200 group-hover:text-[var(--primary)]">
              阅读文章
              <Icon name="lucide:arrow-right" class="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
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
