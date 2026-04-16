<script setup lang="ts">
import ArticleForm from '../../../components/admin/ArticleForm.vue'
import type { ManagedArticle, ManagedArticlePayload } from '~~/shared/types/articles'

definePageMeta({
  layout: 'admin',
})

const route = useRoute()
const router = useRouter()
const id = computed(() => String(route.params.id))

const { data, pending, error, refresh } = await useFetch<{ article: ManagedArticle }>(
  () => `/api/admin/articles/${id.value}`,
)

const saving = ref(false)
const deleting = ref(false)
const errorMessage = ref('')

useSeoMeta({
  title: '编辑文章',
  description: '在后台编辑已有文章。',
})

async function updateCurrentArticle(payload: ManagedArticlePayload) {
  saving.value = true
  errorMessage.value = ''

  try {
    await $fetch(`/api/admin/articles/${id.value}`, {
      method: 'PUT',
      body: payload,
    })

    await refresh()
  } catch (error: unknown) {
    errorMessage.value = typeof error === 'object' && error && 'message' in error
      ? String((error as { message?: string }).message)
        : '更新文章失败'
  } finally {
    saving.value = false
  }
}

async function removeCurrentArticle() {
  if (!window.confirm('确认要从 PostgreSQL 中删除这篇文章吗？')) {
    return
  }

  deleting.value = true
  errorMessage.value = ''

  try {
    await $fetch(`/api/admin/articles/${id.value}`, { method: 'DELETE' })
    await router.push('/admin/articles')
  } catch (error: unknown) {
    errorMessage.value = typeof error === 'object' && error && 'message' in error
      ? String((error as { message?: string }).message)
        : '删除文章失败'
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div v-if="errorMessage || error" class="rounded-2xl border border-red-300 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
      {{ errorMessage || error?.message }}
    </div>

    <div v-if="pending" class="rounded-2xl border border-[var(--border)] px-5 py-12 text-center text-sm text-[var(--text-secondary)]">
      正在加载文章...
    </div>

    <ArticleForm
      v-else
      :article="data?.article"
      :loading="saving || deleting"
      submit-label="保存修改"
      @submit="updateCurrentArticle"
      @delete="removeCurrentArticle"
    />
  </div>
</template>
