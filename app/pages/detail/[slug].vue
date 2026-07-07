<script setup lang="ts">
import type { ManagedArticle } from '~~/shared/types/articles'
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

const { data, error } = await useFetch<{ article: ManagedArticle }>(
  () => `/api/posts/${encodeURIComponent(articleSlug.value)}${preview.value ? '?preview=1' : ''}`,
)

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode || 404,
    statusMessage: error.value.statusMessage || 'Article not found',
  })
}

const article = computed(() => data.value?.article)
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

onMounted(() => {
  void recordArticleView()
})

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
  <PostArticleDetail v-if="article" :article="article" />
</template>
