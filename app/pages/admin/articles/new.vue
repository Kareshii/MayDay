<script setup lang="ts">
import { defineComponent, h } from 'vue'
import ArticleEditorForm from '../../../components/admin/ArticleEditorForm.vue'
import type { ManagedArticle, ManagedArticlePayload } from '~~/shared/types/articles'

interface AdminSettingsResponse {
  databaseConfigured: boolean
}

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

const { data: settings, error: settingsError } = await useFetch<AdminSettingsResponse>('/api/admin/settings')

const databaseConfigured = computed(() => settings.value?.databaseConfigured ?? false)
const databaseErrorMessage = '当前环境还没有配置 `DATABASE_URL`，所以后台暂时不能创建文章。请先在环境变量里配置 PostgreSQL 连接串。'

if (settingsError.value) {
  errorMessage.value = settingsError.value.message
}

const ArticleForm = defineComponent({
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h(ArticleEditorForm, {
      ...attrs,
      disabled: !databaseConfigured.value,
      disabledMessage: !databaseConfigured.value ? databaseErrorMessage : '',
      submitLabel: '创建文章',
    }, slots)
  },
})

async function createNewArticle(payload: ManagedArticlePayload) {
  if (!databaseConfigured.value) {
    errorMessage.value = databaseErrorMessage
    return
  }

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
  <div class="cms-page space-y-7">
    <section>
      <h1 class="cms-page-title">
        新建文章
      </h1>
      <p class="cms-page-subtitle">
        在编辑器中组织标题、摘要、正文与封面，确认后发布到前台。
      </p>
    </section>

    <div v-if="errorMessage" class="rounded-2xl border border-red-300 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/12 dark:text-red-200">
      {{ errorMessage }}
    </div>

    <ArticleForm :loading="saving" submit-label="创建文章" @submit="createNewArticle" />
  </div>
</template>
