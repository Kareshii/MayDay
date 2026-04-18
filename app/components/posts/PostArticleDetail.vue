<script setup lang="ts">
import {
  DEFAULT_ARTICLE_COVER_LAYOUT,
  type ManagedArticle,
} from '~~/shared/types/articles'

const props = defineProps<{
  article: ManagedArticle
}>()

const coverLayout = computed(() => props.article.coverLayout || DEFAULT_ARTICLE_COVER_LAYOUT)
const isTopHero = computed(() => coverLayout.value === 'top-hero')
const isSplitLeft = computed(() => coverLayout.value === 'split-left')
const coverImage = computed(() => props.article.coverImage || '/cover.jpg')
</script>

<template>
  <article v-if="isTopHero" class="space-y-8">
    <header class="relative flex min-h-screen items-end overflow-hidden">
      <img
        :src="coverImage"
        :alt="article.title"
        class="absolute inset-x-0 -top-[10%] h-[114%] w-full object-cover"
      >
      <div class="absolute inset-0 bg-gradient-to-b from-slate-950/30 via-slate-950/48 to-[var(--bg-primary)]" />
      <div class="absolute inset-0 bg-[linear-gradient(118deg,rgba(56,189,248,0.14),transparent_32%,transparent_72%,rgba(14,165,233,0.12))]" />

      <div class="container relative z-10 flex min-h-screen w-full flex-col justify-end pb-16 pt-30 md:pb-22 md:pt-36">
        <div class="max-w-4xl text-white">
          <p class="section-kicker text-white/76">
            ARTICLE
          </p>
          <h1 class="mt-4 max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
            {{ article.title }}
          </h1>
          <p class="mt-5 max-w-2xl text-base leading-8 text-white/86">
            {{ article.summary }}
          </p>

          <div class="mt-8 flex flex-wrap items-center gap-3 text-xs font-medium tracking-[0.18em] text-white/84">
            <span class="rounded-full border border-white/30 bg-white/8 px-3 py-2 backdrop-blur-sm">
              /detail/{{ article.slug }}
            </span>
            <span class="rounded-full border border-white/30 bg-white/8 px-3 py-2 backdrop-blur-sm">
              {{ article.published ? 'Published' : 'Draft Preview' }}
            </span>
          </div>
        </div>
      </div>
    </header>

    <div class="container">
      <div class="surface-card p-6 md:p-10">
        <MDC :value="article.content" class="blog-content" />
      </div>
    </div>
  </article>

  <article v-else class="container space-y-8">
    <header class="overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--card)] shadow-[0_32px_80px_-58px_rgba(15,23,42,0.5)]">
      <div class="grid gap-6 p-6 md:p-10 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)] xl:items-end">
        <div
          v-if="isSplitLeft"
          class="relative aspect-[4/3] overflow-hidden rounded-[1.6rem] bg-slate-950"
        >
          <img
            :src="coverImage"
            :alt="article.title"
            class="absolute inset-0 h-full w-full object-cover"
          >
          <div class="absolute inset-0 bg-gradient-to-t from-black/88 via-black/28 to-transparent" />
        </div>

        <div>
          <p class="section-kicker">
            ARTICLE
          </p>
          <h1 class="mt-4 text-4xl font-semibold tracking-tight text-[var(--text-primary)] md:text-6xl">
            {{ article.title }}
          </h1>
          <p class="mt-5 max-w-2xl text-base leading-8 text-[var(--text-secondary)]">
            {{ article.summary }}
          </p>

          <div class="mt-8 flex flex-wrap items-center gap-3 text-xs font-medium tracking-[0.18em] text-[var(--text-secondary)]">
            <span class="rounded-full border border-[var(--border)] px-3 py-2">
              /detail/{{ article.slug }}
            </span>
            <span class="rounded-full border border-[var(--border)] px-3 py-2">
              {{ article.published ? 'Published' : 'Draft Preview' }}
            </span>
          </div>
        </div>

        <div
          v-if="!isSplitLeft"
          class="relative aspect-[4/3] overflow-hidden rounded-[1.6rem] bg-slate-950"
        >
          <img
            :src="coverImage"
            :alt="article.title"
            class="absolute inset-0 h-full w-full object-cover"
          >
          <div class="absolute inset-0 bg-gradient-to-t from-black/88 via-black/28 to-transparent" />
        </div>
      </div>
    </header>

    <div class="surface-card p-6 md:p-10">
      <MDC :value="article.content" class="blog-content" />
    </div>
  </article>
</template>
