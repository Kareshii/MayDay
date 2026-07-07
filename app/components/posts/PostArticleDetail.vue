<script setup lang="ts">
import {
  DEFAULT_ARTICLE_COVER_LAYOUT,
  type ManagedArticle,
} from '~~/shared/types/articles'
import ArticleReadingEnhancer from './ArticleReadingEnhancer.vue'

const props = defineProps<{
  article: ManagedArticle
}>()

const coverLayout = computed(() => props.article.coverLayout || DEFAULT_ARTICLE_COVER_LAYOUT)
const isTopHero = computed(() => coverLayout.value === 'top-hero')
const isSplitLeft = computed(() => coverLayout.value === 'split-left')
const coverImage = computed(() => props.article.coverImage || '/cover.jpg')
const isHtmlContent = computed(() => /<\/?(?:a|article|blockquote|br|code|div|em|figure|figcaption|h[1-6]|hr|img|li|ol|p|pre|span|strong|table|tbody|td|th|thead|tr|ul)\b/i.test(props.article.content))

interface ArticleExtraMeta {
  author?: string
  viewCount?: number
  views?: number
  readCount?: number
}

const articleExtraMeta = computed(() => props.article as ManagedArticle & ArticleExtraMeta)
const plainContent = computed(() => props.article.content
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;|&#160;/g, ' ')
  .replace(/&[a-z]+;/gi, ' ')
  .replace(/[`*_#>\-[\]()]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim())
const readingMinutes = computed(() => Math.max(1, Math.ceil(plainContent.value.length / 500)))
const articleAuthor = computed(() => articleExtraMeta.value.author?.trim() || 'mayday.life')
const articleViewCount = computed(() => {
  const value = Number(articleExtraMeta.value.viewCount ?? articleExtraMeta.value.views ?? articleExtraMeta.value.readCount ?? 0)
  return Number.isFinite(value) && value >= 0 ? value : 0
})
const formattedArticleDate = computed(() => {
  const source = props.article.createdAt || props.article.updatedAt
  const date = new Date(source)

  if (Number.isNaN(date.getTime())) {
    return String(source || '').slice(0, 10)
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Shanghai',
  }).format(date).replaceAll('/', '-')
})
const formattedViewCount = computed(() => new Intl.NumberFormat('zh-CN').format(articleViewCount.value))
const articleMetaItems = computed(() => [
  {
    label: '作者',
    value: articleAuthor.value,
    icon: 'lucide:user-round',
  },
  {
    label: '时间',
    value: formattedArticleDate.value,
    icon: 'lucide:calendar-days',
  },
  {
    label: '观看',
    value: `${formattedViewCount.value} 次`,
    icon: 'lucide:eye',
  },
  {
    label: '阅读',
    value: `约 ${readingMinutes.value} 分钟`,
    icon: 'lucide:clock-3',
  },
])
</script>

<template>
  <article v-if="isTopHero" class="space-y-8">
    <header class="relative flex min-h-screen overflow-hidden">
      <img
        :src="coverImage"
        :alt="article.title"
        class="absolute inset-x-0 -top-[10%] h-[114%] w-full object-cover"
      >
      <div class="absolute inset-0 bg-gradient-to-b from-slate-950/34 via-slate-950/72 to-[var(--bg-primary)]" />
      <div class="absolute inset-0 bg-[linear-gradient(115deg,rgba(56,189,248,0.12),transparent_28%,transparent_68%,rgba(244,114,182,0.1))]" />

      <div class="container relative z-10 flex min-h-screen w-full flex-col pb-16 pt-30 md:pb-22 md:pt-36">
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
              {{ article.slug }}
            </span>
          </div>
        </div>
      </div>
    </header>

    <div class="container">
      <ArticleReadingEnhancer :content-key="article.id">
        <div class="mb-8 grid gap-3 border-b border-[var(--border)] pb-6 sm:grid-cols-2 xl:grid-cols-4">
          <div
            v-for="item in articleMetaItems"
            :key="item.label"
            class="flex items-center gap-3 rounded-xl bg-[var(--surface-low)] px-4 py-3"
          >
            <span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--text-primary)]">
              <Icon :name="item.icon" class="size-4" />
            </span>
            <span class="min-w-0">
              <span class="block text-[11px] font-semibold tracking-[0.18em] text-[var(--text-secondary)]">{{ item.label }}</span>
              <span class="mt-1 block truncate text-sm font-semibold text-[var(--text-primary)]">{{ item.value }}</span>
            </span>
          </div>
        </div>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div v-if="isHtmlContent" class="blog-content" v-html="article.content" />
        <MDC v-else :value="article.content" class="blog-content" />
      </ArticleReadingEnhancer>
    </div>
  </article>

  <article v-else class="container space-y-8 pt-26">
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
              {{ article.slug }}
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

    <ArticleReadingEnhancer :content-key="article.id">
      <div class="mb-8 grid gap-3 border-b border-[var(--border)] pb-6 sm:grid-cols-2 xl:grid-cols-4">
        <div
          v-for="item in articleMetaItems"
          :key="item.label"
          class="flex items-center gap-3 rounded-xl bg-[var(--surface-low)] px-4 py-3"
        >
          <span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--text-primary)]">
            <Icon :name="item.icon" class="size-4" />
          </span>
          <span class="min-w-0">
            <span class="block text-[11px] font-semibold tracking-[0.18em] text-[var(--text-secondary)]">{{ item.label }}</span>
            <span class="mt-1 block truncate text-sm font-semibold text-[var(--text-primary)]">{{ item.value }}</span>
          </span>
        </div>
      </div>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div v-if="isHtmlContent" class="blog-content" v-html="article.content" />
      <MDC v-else :value="article.content" class="blog-content" />
    </ArticleReadingEnhancer>
  </article>
</template>
