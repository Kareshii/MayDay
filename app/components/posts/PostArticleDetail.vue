<script setup lang="ts">
import {
  DEFAULT_ARTICLE_COVER_LAYOUT,
  type ManagedArticle,
} from '~~/shared/types/articles'
import type { PublicArticleComment } from '~~/shared/types/comments'
import ArticleReadingEnhancer from './ArticleReadingEnhancer.vue'
import PostArticleComments from './PostArticleComments.vue'

const props = defineProps<{
  article: ManagedArticle
  comments?: PublicArticleComment[]
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
  <article v-if="isTopHero" class="public-article article-layout article-layout--hero">
    <header class="public-article__hero article-hero">
      <img :src="coverImage" :alt="article.title" class="article-hero__image">
      <div class="article-hero__shade" />
      <div class="container article-hero__content">
        <NuxtLink to="/posts" class="article-back"><Icon name="lucide:arrow-up-left" class="size-4" />全部文章 / JOURNAL</NuxtLink>
        <div class="article-hero__copy">
          <p class="article-eyebrow">01 / ARTICLE</p>
          <h1>{{ article.title }}</h1>
          <p class="article-summary">{{ article.summary }}</p>
        </div>
        <span class="article-hero__scroll">SCROLL TO READ <Icon name="lucide:arrow-down" class="size-3.5" /></span>
      </div>
    </header>

    <div class="container article-body">
      <ArticleReadingEnhancer :content-key="article.id">
        <div class="article-meta">
          <div v-for="item in articleMetaItems" :key="item.label" class="article-meta__item">
            <span class="article-meta__label"><Icon :name="item.icon" class="size-3.5" />{{ item.label }}</span>
            <span class="article-meta__value">{{ item.value }}</span>
          </div>
        </div>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div v-if="isHtmlContent" class="blog-content" v-html="article.content" />
        <MDC v-else :value="article.content" class="blog-content" />
      </ArticleReadingEnhancer>
      <PostArticleComments :comments="comments || []" />
    </div>
  </article>

  <article v-else class="public-article container article-layout article-layout--split">
    <header class="public-article__header article-header">
      <div class="article-header__top">
        <NuxtLink to="/posts" class="article-back"><Icon name="lucide:arrow-up-left" class="size-4" />全部文章 / JOURNAL</NuxtLink>
        <span class="article-eyebrow">01 / ARTICLE</span>
      </div>
      <div class="article-header__grid" :class="{ 'article-header__grid--image-left': isSplitLeft }">
        <div v-if="isSplitLeft" class="article-cover"><img :src="coverImage" :alt="article.title"></div>
        <div class="article-header__copy">
          <h1>{{ article.title }}</h1>
          <p class="article-summary">{{ article.summary }}</p>
          <span class="article-header__date">{{ formattedArticleDate }}<Icon name="lucide:arrow-down-right" class="size-5" /></span>
        </div>
        <div v-if="!isSplitLeft" class="article-cover"><img :src="coverImage" :alt="article.title"></div>
      </div>
    </header>

    <ArticleReadingEnhancer :content-key="article.id">
        <div class="article-meta">
          <div v-for="item in articleMetaItems" :key="item.label" class="article-meta__item">
            <span class="article-meta__label"><Icon :name="item.icon" class="size-3.5" />{{ item.label }}</span>
            <span class="article-meta__value">{{ item.value }}</span>
          </div>
        </div>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div v-if="isHtmlContent" class="blog-content" v-html="article.content" />
        <MDC v-else :value="article.content" class="blog-content" />
    </ArticleReadingEnhancer>
    <PostArticleComments :comments="comments || []" />
  </article>
</template>

<style scoped>
.article-layout { color: var(--text-primary); }
.article-layout--split { padding-top: clamp(7rem, 13vw, 12rem); padding-bottom: 3rem; }
.article-header { margin-bottom: clamp(4rem, 8vw, 8rem); }
.article-header__top { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--border); }
.article-back { display: inline-flex; align-items: center; gap: .65rem; color: var(--text-secondary); font-size: .63rem; letter-spacing: .08em; transition: color .2s; }
.article-back:hover { color: var(--text-primary); }
.article-eyebrow { color: var(--text-muted); font-size: .6rem; font-weight: 500; letter-spacing: .18em; }
.article-header__grid { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, .85fr); align-items: center; gap: clamp(2rem, 5vw, 5rem); padding-top: clamp(2.5rem, 5vw, 5rem); }
.article-header__grid--image-left { grid-template-columns: minmax(0, .85fr) minmax(0, 1.2fr); }
.article-header h1, .article-hero h1 { font-size: clamp(2.75rem, 5.5vw, 5.75rem); font-weight: 400; line-height: 1.15; letter-spacing: -.05em; overflow-wrap: anywhere; }
.article-summary { max-width: 36rem; margin-top: 2rem; color: var(--text-secondary); font-size: .95rem; line-height: 1.95; }
.article-header__date { display: flex; justify-content: space-between; align-items: center; margin-top: 3rem; padding-block: 1.1rem; border-block: 1px solid var(--border); color: var(--text-muted); font-size: .65rem; letter-spacing: .12em; }
.article-cover { overflow: hidden; background: var(--surface-low); }
.article-cover img { display: block; width: 100%; aspect-ratio: 4 / 5; object-fit: cover; filter: grayscale(1); }
.article-hero { position: relative; min-height: 100svh; overflow: hidden; background: #000; color: #fff; }
.article-hero__image { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: grayscale(1); }
.article-hero__shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgb(0 0 0 / 48%), rgb(0 0 0 / 35%) 25%, rgb(0 0 0 / 84%) 80%, #000); }
.article-hero__content { position: relative; z-index: 1; display: flex; min-height: 100svh; flex-direction: column; padding-top: 9rem; padding-bottom: 3rem; }
.article-hero .article-back { color: rgb(255 255 255 / 65%); }
.article-hero .article-back:hover { color: #fff; }
.article-hero__copy { max-width: 58rem; margin-top: auto; padding-top: 5rem; }
.article-hero .article-eyebrow { color: rgb(255 255 255 / 60%); margin-bottom: 1.5rem; }
.article-hero h1 { font-size: clamp(3rem, 6.5vw, 7rem); }
.article-hero .article-summary { color: rgb(255 255 255 / 65%); }
.article-hero__scroll { display: flex; gap: 1rem; align-items: center; margin-top: 3rem; font-size: .56rem; letter-spacing: .2em; color: rgb(255 255 255 / 50%); }
.article-body { padding-top: clamp(3rem, 6vw, 6rem); }
.article-meta { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1.5rem; margin-bottom: 3rem; padding-block: 1.5rem 2rem; border-block: 1px solid var(--border); }
.article-meta__item { min-width: 0; }
.article-meta__label { display: flex; gap: .45rem; align-items: center; color: var(--text-muted); font-size: .6rem; letter-spacing: .08em; }
.article-meta__value { display: block; margin-top: .7rem; color: var(--text-primary); font-size: .72rem; overflow-wrap: anywhere; }
@media (max-width: 767px) {
  .article-header__grid, .article-header__grid--image-left { grid-template-columns: minmax(0, 1fr); }
  .article-cover img { aspect-ratio: 16 / 10; }
  .article-meta { grid-template-columns: repeat(2, minmax(0, 1fr)); row-gap: 1.75rem; }
  .article-hero__content { padding-top: 7rem; }
  .article-header__date { margin-top: 2rem; }
}
</style>
