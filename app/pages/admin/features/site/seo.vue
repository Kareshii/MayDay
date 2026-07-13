<script setup lang="ts">
import type { AdminSeoSettings } from '@/composables/useAdminSiteSettings'

definePageMeta({
  layout: 'admin',
})

useSeoMeta({
  title: 'SEO 设置',
  description: '维护首页 SEO 信息。',
})

const {
  data,
  pending,
  error,
  refresh,
  savingSection,
  saveSection,
} = await useAdminSiteSettings('seo')

const seo = reactive<AdminSeoSettings>({
  title: '',
  description: '',
  keywords: '',
})
const settingsHydrated = ref(false)
const settingsDirty = ref(false)

watch(data, (value) => {
  if (value?.seo) {
    settingsHydrated.value = false
    Object.assign(seo, value.seo)
    void nextTick(() => {
      settingsDirty.value = false
      settingsHydrated.value = true
    })
  }
}, { immediate: true })

watch(seo, () => {
  if (!settingsHydrated.value) {
    return
  }

  settingsDirty.value = true
}, { deep: 1 })

async function saveSeoSettings() {
  const snapshot = JSON.stringify(seo)
  const saved = await saveSection('seo', seo)

  if (saved && JSON.stringify(seo) === snapshot) {
    settingsDirty.value = false
  }
}

const siteHost = ref('mayday.life')
const previewTitle = computed(() => seo.title.trim() || '网站标题')
const previewDescription = computed(() => seo.description.trim() || '首页描述会显示在这里。')
const keywordItems = computed(() => seo.keywords
  .split(/[,，]/)
  .map(item => item.trim())
  .filter(Boolean))
const saveStateLabel = computed(() => savingSection.value === 'seo'
  ? '保存中'
  : settingsDirty.value ? '待保存' : '已保存')
const headerActions = computed(() => [
  {
    label: savingSection.value === 'seo' ? '保存中...' : '保存 SEO',
    icon: 'lucide:save',
    disabled: pending.value || savingSection.value === 'seo' || !settingsDirty.value,
    onClick: saveSeoSettings,
  },
])

onMounted(() => {
  siteHost.value = window.location.host || siteHost.value
})
</script>

<template>
  <div class="cms-page space-y-5">
    <AdminPageHeader title="SEO 设置" subtitle="首页搜索摘要与关键词" :actions="headerActions" />

    <AdminSiteSettingsNav />

    <UiAlert v-if="error" variant="destructive">
      <Icon name="lucide:circle-alert" />
      <UiAlertTitle>SEO 设置加载失败</UiAlertTitle>
      <UiAlertDescription>{{ error.message }}</UiAlertDescription>
      <UiAlertAction>
        <UiButton variant="outline" size="sm" @click="refresh">
          <Icon name="lucide:refresh-cw" class="size-4" />
          重试
        </UiButton>
      </UiAlertAction>
    </UiAlert>

    <div v-else-if="pending" class="max-w-xl space-y-4" aria-label="正在加载 SEO 设置">
      <UiSkeleton class="h-24 w-full" />
      <UiSkeleton class="h-72 w-full" />
      <UiSkeleton class="h-48 w-full" />
    </div>

    <template v-else>
      <section class="grid overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--surface-card)] sm:grid-cols-3">
        <div class="flex min-h-24 items-center gap-3 border-b border-[var(--border-soft)] px-5 py-4 sm:border-b-0 sm:border-r">
          <span class="grid size-9 shrink-0 place-items-center rounded-md bg-[var(--surface-high)] text-[var(--text-secondary)]">
            <Icon name="lucide:type" class="size-4" />
          </span>
          <div class="min-w-0">
            <p class="text-xs font-medium text-[var(--text-secondary)]">标题长度</p>
            <p class="mt-1 text-sm font-semibold tabular-nums text-[var(--text-primary)]">{{ seo.title.length }}</p>
          </div>
        </div>
        <div class="flex min-h-24 items-center gap-3 border-b border-[var(--border-soft)] px-5 py-4 sm:border-b-0 sm:border-r">
          <span class="grid size-9 shrink-0 place-items-center rounded-md bg-[var(--surface-high)] text-[var(--text-secondary)]">
            <Icon name="lucide:align-left" class="size-4" />
          </span>
          <div class="min-w-0">
            <p class="text-xs font-medium text-[var(--text-secondary)]">描述长度</p>
            <p class="mt-1 text-sm font-semibold tabular-nums text-[var(--text-primary)]">{{ seo.description.length }}</p>
          </div>
        </div>
        <div class="flex min-h-24 items-center gap-3 px-5 py-4">
          <span class="grid size-9 shrink-0 place-items-center rounded-md bg-[var(--surface-high)] text-[var(--text-secondary)]">
            <Icon name="lucide:save" class="size-4" />
          </span>
          <div class="min-w-0">
            <p class="text-xs font-medium text-[var(--text-secondary)]">修改状态</p>
            <p class="mt-1 text-sm font-semibold text-[var(--text-primary)]">{{ saveStateLabel }}</p>
          </div>
        </div>
      </section>

      <form class="max-w-xl space-y-4" @submit.prevent="saveSeoSettings">
        <AdminSettingsPanel title="搜索摘要" description="首页 meta 信息" icon="lucide:file-search">
          <AdminSettingsRow label="页面标题" description="搜索结果的主标题">
            <div class="space-y-2">
              <UiInput v-model="seo.title" aria-label="页面标题" placeholder="留空则使用网站名称" />
              <p class="text-right text-xs tabular-nums text-[var(--text-muted)]">
                {{ seo.title.length }} 字符
              </p>
            </div>
          </AdminSettingsRow>

          <AdminSettingsRow label="页面描述" description="搜索结果的摘要内容" align="start">
            <div class="space-y-2">
              <UiTextarea v-model="seo.description" aria-label="页面描述" rows="5" placeholder="站点描述" />
              <p class="text-right text-xs tabular-nums text-[var(--text-muted)]">
                {{ seo.description.length }} 字符
              </p>
            </div>
          </AdminSettingsRow>

          <AdminSettingsRow label="关键词" description="使用逗号分隔">
            <UiInput v-model="seo.keywords" aria-label="关键词" placeholder="博客, 前端, 设计" />
          </AdminSettingsRow>
        </AdminSettingsPanel>

        <AdminSettingsPanel title="搜索结果预览" icon="lucide:scan-search">
          <div class="px-5 py-5">
            <div class="min-w-0 font-sans">
              <p class="truncate text-sm text-[var(--success)]">
                https://{{ siteHost }}/
              </p>
              <p class="mt-1 line-clamp-2 text-lg font-medium leading-6 text-[var(--primary)]">
                {{ previewTitle }}
              </p>
              <p class="mt-1 line-clamp-3 text-sm leading-6 text-[var(--text-secondary)]">
                {{ previewDescription }}
              </p>
            </div>
          </div>
        </AdminSettingsPanel>

        <AdminSettingsPanel title="关键词预览" icon="lucide:tags">
          <div class="px-5 py-5">
            <div v-if="keywordItems.length" class="flex flex-wrap gap-2">
              <UiBadge
                v-for="keyword in keywordItems"
                :key="keyword"
                variant="outline"
                class="normal-case tracking-[0]"
              >
                {{ keyword }}
              </UiBadge>
            </div>
            <div v-else class="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
              <Icon name="lucide:tag" class="size-4 text-[var(--text-muted)]" />
              暂无关键词
            </div>
          </div>
        </AdminSettingsPanel>

      </form>
    </template>
  </div>
</template>
