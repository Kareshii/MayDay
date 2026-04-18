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

watchEffect(() => {
  heroNavbarOverlay.value = article.value?.coverLayout === 'top-hero'
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
