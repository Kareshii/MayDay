<script setup lang="ts">
import { defineComponent, h } from 'vue'
import ArticleEditorForm from '../../../components/admin/ArticleEditorForm.vue'
import type { ManagedArticle, ManagedArticlePayload } from '~~/shared/types/articles'

interface AdminSettingsResponse {
  databaseConfigured: boolean
}

interface ArticleEditorSubmitOptions {
  shortcut?: boolean
}

definePageMeta({
  layout: 'admin',
})

const route = useRoute()
const router = useRouter()
const id = computed(() => String(route.params.id))

const { data: settings, error: settingsError } = await useFetch<AdminSettingsResponse>('/api/admin/settings')

const databaseConfigured = computed(() => settings.value?.databaseConfigured ?? false)
const databaseErrorMessage = '当前环境还没有配置 `DATABASE_URL`，所以后台暂时不能读取或保存文章。请先在环境变量里配置 PostgreSQL 连接串。'

const articleRequest = databaseConfigured.value
  ? await useFetch<{ article: ManagedArticle }>(() => `/api/admin/articles/${id.value}`)
  : null

const data = computed(() => articleRequest?.data.value)
const pending = computed(() => articleRequest?.pending.value ?? false)
const error = computed(() => settingsError.value || (!databaseConfigured.value ? { message: databaseErrorMessage } : articleRequest?.error.value || null))

const saving = ref(false)
const deleting = ref(false)
const { showSuccessToast, showErrorToast } = useAdminToast()

const ArticleForm = defineComponent({
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h(ArticleEditorForm, {
      ...attrs,
      disabled: !databaseConfigured.value,
      disabledMessage: !databaseConfigured.value ? databaseErrorMessage : '',
      submitLabel: '保存修改',
    }, slots)
  },
})

useSeoMeta({
  title: '编辑文章',
  description: '在后台编辑已有文章。',
})

async function updateCurrentArticle(payload: ManagedArticlePayload, options?: ArticleEditorSubmitOptions) {
  if (!databaseConfigured.value) {
    showErrorToast('无法保存文章', databaseErrorMessage)
    return
  }

  saving.value = true

  try {
    await $fetch(`/api/admin/articles/${id.value}`, {
      method: 'PUT',
      body: payload,
    })

    showSuccessToast('文章已保存')

    if (!options?.shortcut) {
      await router.push('/admin/articles')
    }
  } catch (error: unknown) {
    showErrorToast('更新文章失败', getRequestErrorMessage(error, '更新文章失败'))
  } finally {
    saving.value = false
  }
}

async function removeCurrentArticle() {
  if (!databaseConfigured.value) {
    showErrorToast('无法删除文章', databaseErrorMessage)
    return
  }

  if (!import.meta.client) {
    return
  }

  if (!window.confirm('确认要从 PostgreSQL 中删除这篇文章吗？')) {
    return
  }

  deleting.value = true

  try {
    await $fetch(`/api/admin/articles/${id.value}`, { method: 'DELETE' })
    showSuccessToast('文章已删除')
    await router.push('/admin/articles')
  } catch (error: unknown) {
    showErrorToast('删除文章失败', getRequestErrorMessage(error, '删除文章失败'))
  } finally {
    deleting.value = false
  }
}

watch(error, (value) => {
  if (value && databaseConfigured.value) {
    showErrorToast('文章加载失败', value.message)
  }
}, { immediate: true })
</script>

<template>
  <div class="cms-page cms-editor-page space-y-4">
    <AdminPageHeader title="编辑文章"  />

    <div v-if="pending" class="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-card)] px-5 py-12 text-center text-sm text-[var(--text-secondary)]">
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
