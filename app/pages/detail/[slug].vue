<script setup lang="ts">
import type { ManagedArticle } from '~~/shared/types/articles'
import type { PublicArticleComment } from '~~/shared/types/comments'
import PostArticleDetail from '@/components/posts/PostArticleDetail.vue'

definePageMeta({
  layout: 'default',
})

const route = useRoute()
const preview = computed(() => route.query.preview === '1')
const articleSlug = computed(() => {
  const rawSlug = route.params.slug
  if (Array.isArray(rawSlug)) {
    return rawSlug.join('/')
  }

  return typeof rawSlug === 'string' ? rawSlug : ''
})

if (!articleSlug.value) {
  throw createError({
    statusCode: 400,
    statusMessage: 'Article slug is required',
  })
}

const articleRequest = useFetch<{
  article: ManagedArticle
  comments: PublicArticleComment[]
}>(
  () => `/api/posts/${encodeURIComponent(articleSlug.value)}${preview.value ? '?preview=1' : ''}`,
  {
    lazy: import.meta.client,
  },
)

if (import.meta.server) {
  await articleRequest
}

const { data, error, status } = articleRequest

if (import.meta.server && error.value) {
  throw createError({
    statusCode: error.value.statusCode || 404,
    statusMessage: error.value.statusMessage || 'Article not found',
  })
}

const article = computed(() => data.value?.article)
const comments = computed(() => data.value?.comments || [])
const isLoading = computed(() => status.value === 'pending' && !article.value)
const heroNavbarOverlay = useState<boolean>('hero-navbar-overlay', () => false)
const recordedViewSlug = ref('')

function getVisitorId() {
  const storageKey = 'mayday_article_visitor_id'
  const existing = window.localStorage.getItem(storageKey)

  if (existing) {
    return existing
  }

  const next = globalThis.crypto?.randomUUID?.() || `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  window.localStorage.setItem(storageKey, next)
  return next
}

async function recordArticleView() {
  if (!article.value || preview.value || recordedViewSlug.value === article.value.slug) {
    return
  }

  recordedViewSlug.value = article.value.slug

  const response = await $fetch<{
    counted: boolean
    skipped?: boolean
    viewCount: number | null
  }>(`/api/posts/${encodeURIComponent(article.value.slug)}/view`, {
    method: 'POST',
    body: {
      visitorId: getVisitorId(),
    },
  }).catch(() => null)

  if (typeof response?.viewCount === 'number' && data.value?.article) {
    data.value.article.viewCount = response.viewCount
  }
}

watchEffect(() => {
  heroNavbarOverlay.value = article.value?.coverLayout === 'top-hero'
})

if (import.meta.client) {
  watch(error, (value) => {
    if (!value) {
      return
    }

    showError(createError({
      statusCode: value.statusCode || 404,
      statusMessage: value.statusMessage || 'Article not found',
    }))
  }, { immediate: true })

  watch(article, () => {
    void recordArticleView()
  }, { immediate: true })
}

onUnmounted(() => {
  heroNavbarOverlay.value = false
})

useSeoMeta({
  title: () => article.value?.title,
  description: () => article.value?.summary,
  ogImage: () => article.value?.coverImage || '/cover.jpg',
})
</script>

<template>
  <PostArticleDetail v-if="article" :article="article" :comments="comments" />
  <section v-else-if="isLoading" class="container space-y-8 pt-26">
    <header class="overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--card)] p-6 md:p-10">
      <div class="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)] xl:items-end">
        <div class="space-y-5">
          <div class="h-3 w-24 animate-pulse rounded bg-[var(--surface-low)]" />
          <div class="h-12 w-4/5 animate-pulse rounded bg-[var(--surface-low)] md:h-16" />
          <div class="h-4 w-full animate-pulse rounded bg-[var(--surface-low)]" />
          <div class="h-4 w-2/3 animate-pulse rounded bg-[var(--surface-low)]" />
        </div>
        <div class="aspect-[4/3] animate-pulse rounded-[1.6rem] bg-[var(--surface-low)]" />
      </div>
    </header>
    <div class="surface-card p-6 md:p-10">
      <div class="space-y-4">
        <div class="h-4 w-full animate-pulse rounded bg-[var(--surface-low)]" />
        <div class="h-4 w-11/12 animate-pulse rounded bg-[var(--surface-low)]" />
        <div class="h-4 w-10/12 animate-pulse rounded bg-[var(--surface-low)]" />
        <div class="h-4 w-3/4 animate-pulse rounded bg-[var(--surface-low)]" />
      </div>
    </div>
  </section>
</template>
