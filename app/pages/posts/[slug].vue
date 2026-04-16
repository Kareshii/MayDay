<script setup lang="ts">
import type { ManagedArticle } from '~~/shared/types/articles'

definePageMeta({
  layout: 'default',
})

const route = useRoute()
const preview = computed(() => route.query.preview === '1')

const { data, error } = await useFetch<{ article: ManagedArticle }>(
  () => `/api/posts/${String(route.params.slug)}${preview.value ? '?preview=1' : ''}`,
)

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode || 404,
    statusMessage: error.value.statusMessage || 'Article not found',
  })
}

const article = computed(() => data.value?.article)

useSeoMeta({
  title: () => article.value?.title,
  description: () => article.value?.summary,
  ogImage: () => article.value?.coverImage || '/cover.jpg',
})
</script>

<template>
  <article class="site-container">
    <header class="overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--card)] shadow-[0_32px_80px_-58px_rgba(15,23,42,0.5)]">
      <div class="grid gap-6 p-6 md:p-10 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)] xl:items-end">
        <div>
          <p class="section-kicker">
            ARTICLE
          </p>
          <h1 class="mt-4 text-4xl font-semibold tracking-tight text-[var(--text-primary)] md:text-6xl">
            {{ article?.title }}
          </h1>
          <p class="mt-5 max-w-2xl text-base leading-8 text-[var(--text-secondary)]">
            {{ article?.summary }}
          </p>

          <div class="mt-8 flex flex-wrap items-center gap-3 text-xs font-medium tracking-[0.18em] text-[var(--text-secondary)]">
            <span class="rounded-full border border-[var(--border)] px-3 py-2">
              /posts/{{ article?.slug }}
            </span>
            <span class="rounded-full border border-[var(--border)] px-3 py-2">
              {{ article?.published ? 'Published' : 'Draft Preview' }}
            </span>
          </div>
        </div>

        <div class="relative aspect-[4/3] overflow-hidden rounded-[1.6rem] bg-slate-950">
          <img
            :src="article?.coverImage || '/cover.jpg'"
            :alt="article?.title || ''"
            class="absolute inset-0 h-full w-full object-cover"
          >
          <div class="absolute inset-0 bg-gradient-to-t from-black/88 via-black/28 to-transparent" />
        </div>
      </div>
    </header>

    <div class="mt-8 surface-card p-6 md:p-10">
      <!-- eslint-disable vue/no-v-html -->
      <div
        class="blog-content"
        v-html="article?.content"
      />
      <!-- eslint-enable vue/no-v-html -->
    </div>
  </article>
</template>
