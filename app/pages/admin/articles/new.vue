<script setup lang="ts">
import ArticleEditorForm from '../../../components/admin/ArticleEditorForm.vue'
import type { ManagedArticle, ManagedArticlePayload } from '~~/shared/types/articles'
import { normalizeArticleSlug } from '~~/shared/utils/articleSlug'

interface AdminSettingsResponse {
  databaseConfigured: boolean
}

interface ArticleEditorFormExpose {
  getPayload: () => ManagedArticlePayload
}

interface ArticleEditorSubmitOptions {
  shortcut?: boolean
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
const autoSaving = ref(false)
const createdArticleId = ref('')
const formRef = ref<ArticleEditorFormExpose | null>(null)
const { showSuccessToast, showErrorToast } = useAdminToast()

const { data: settings, error: settingsError } = await useFetch<AdminSettingsResponse>('/api/admin/settings')

const databaseConfigured = computed(() => settings.value?.databaseConfigured ?? false)
const databaseErrorMessage = '当前环境还没有配置 `DATABASE_URL`，所以后台暂时不能创建文章。请先在环境变量里配置 PostgreSQL 连接串。'

const headerActions = computed(() => [
  {
    label: autoSaving.value ? '保存草稿中...' : '返回',
    icon: 'lucide:arrow-left',
    variant: 'outline' as const,
    disabled: saving.value || autoSaving.value,
    onClick: leaveEditor,
  },
])

function buildDraftPayload() {
  const payload = formRef.value?.getPayload()

  if (!payload) {
    return null
  }

  const now = new Date()
  const fallbackTitle = `未命名草稿 ${now.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })}`
  const title = payload.title.trim() || fallbackTitle
  const slugBase = normalizeArticleSlug(payload.slug || title) || 'draft'

  return {
    ...payload,
    title,
    slug: `${slugBase}-${now.getTime()}`,
    published: false,
    pinned: false,
    content: payload.content.trim() || '<p>未命名草稿</p>',
  }
}

async function saveDraftBeforeLeave() {
  if (!databaseConfigured.value || saving.value || autoSaving.value || createdArticleId.value) {
    return true
  }

  const payload = buildDraftPayload()

  if (!payload) {
    return true
  }

  autoSaving.value = true

  try {
    const response = await $fetch<{ article: ManagedArticle }>('/api/admin/articles', {
      method: 'POST',
      body: payload,
    })

    createdArticleId.value = response.article.id
    showSuccessToast('草稿已自动保存')
    return true
  } catch (error: unknown) {
    showErrorToast('自动保存草稿失败', getRequestErrorMessage(error, '自动保存草稿失败'))
    return false
  } finally {
    autoSaving.value = false
  }
}

async function leaveEditor() {
  const saved = await saveDraftBeforeLeave()

  if (!saved) {
    return
  }

  await router.push('/admin/articles')
}

async function createNewArticle(payload: ManagedArticlePayload, options?: ArticleEditorSubmitOptions) {
  if (!databaseConfigured.value) {
    showErrorToast('无法创建文章', databaseErrorMessage)
    return
  }

  saving.value = true

  try {
    const isShortcutSave = Boolean(options?.shortcut)
    const hasCreatedArticle = Boolean(createdArticleId.value)
    const response = await $fetch<{ article: ManagedArticle }>(
      hasCreatedArticle ? `/api/admin/articles/${createdArticleId.value}` : '/api/admin/articles',
      {
        method: hasCreatedArticle ? 'PUT' : 'POST',
        body: payload,
      },
    )

    createdArticleId.value = response.article.id
    showSuccessToast(isShortcutSave || hasCreatedArticle ? '文章已保存' : '文章已创建')

    if (!isShortcutSave) {
      await router.push('/admin/articles')
    }
  } catch (error: unknown) {
    showErrorToast('创建文章失败', getRequestErrorMessage(error, '创建文章失败'))
  } finally {
    saving.value = false
  }
}

onBeforeRouteLeave(async () => {
  const saved = await saveDraftBeforeLeave()
  return saved || false
})

onBeforeUnmount(() => {
  void saveDraftBeforeLeave()
})

watch(settingsError, (value) => {
  if (value) {
    showErrorToast('系统设置加载失败', value.message)
  }
}, { immediate: true })
</script>

<template>
  <div class="cms-page cms-editor-page space-y-4">
    <AdminPageHeader title="新建文章"  :actions="headerActions" />

    <ArticleEditorForm
      ref="formRef"
      :loading="saving || autoSaving"
      :disabled="!databaseConfigured"
      :disabled-message="!databaseConfigured ? databaseErrorMessage : ''"
      submit-label="创建文章"
      @submit="createNewArticle"
    />
  </div>
</template>
