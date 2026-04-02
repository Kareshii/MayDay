<script setup lang="ts">
import ArticleForm from '../../../components/admin/ArticleForm.vue'
import type { ManagedArticle, ManagedArticlePayload } from '../../../../shared/types/articles'

definePageMeta({
  layout: 'admin',
})

useSeoMeta({
  title: '新建文章',
  description: '在后台创建一篇新的数据库文章。',
})

const router = useRouter()
const saving = ref(false)
const errorMessage = ref('')

async function createNewArticle(payload: ManagedArticlePayload) {
  saving.value = true
  errorMessage.value = ''

  try {
    const response = await $fetch<{ article: ManagedArticle }>('/api/admin/articles', {
      method: 'POST',
      body: payload,
    })

    await router.push(`/admin/articles/${response.article.id}`)
  } catch (error: unknown) {
    errorMessage.value = typeof error === 'object' && error && 'message' in error
      ? String((error as { message?: string }).message)
        : '创建文章失败'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div v-if="errorMessage" class="rounded-2xl border border-red-300 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
      {{ errorMessage }}
    </div>

    <ArticleForm :loading="saving" submit-label="创建文章" @submit="createNewArticle" />
  </div>
</template>
