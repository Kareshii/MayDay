<script setup lang="ts">
interface FriendLinkItem {
  id: string
  title: string
  url: string
  description: string
  order: number
  enabled: boolean
}

interface FeatureSettings {
  robotsText: string
  sitemapEnabled: boolean
  sitemapFormat: 'txt' | 'xml'
  baiduPushToken: string
  bingPushToken: string
  searchPushScript: string
  friendLinks: FriendLinkItem[]
}

definePageMeta({
  layout: 'admin',
})

useSeoMeta({
  title: '功能管理',
  description: '管理 Robots、Sitemap、友情链接和搜索推送配置。',
})

const saving = ref(false)
const { showSuccessToast, showErrorToast } = useAdminToast()

const { data, pending, error, refresh } = await useFetch<{ features: FeatureSettings }>('/api/admin/features')

const features = reactive<FeatureSettings>({
  robotsText: '',
  sitemapEnabled: true,
  sitemapFormat: 'txt',
  baiduPushToken: '',
  bingPushToken: '',
  searchPushScript: '',
  friendLinks: [],
})

watch(data, (value) => {
  if (!value?.features) {
    return
  }

  Object.assign(features, {
    ...value.features,
    friendLinks: value.features.friendLinks.map(item => ({ ...item })),
  })
}, { immediate: true })

function createLocalId() {
  return globalThis.crypto?.randomUUID?.() || `friend-link-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function addFriendLink() {
  features.friendLinks.push({
    id: createLocalId(),
    title: '新友链',
    url: 'https://example.com',
    description: '',
    order: features.friendLinks.length + 1,
    enabled: true,
  })
}

function removeFriendLink(id: string) {
  features.friendLinks = features.friendLinks.filter(item => item.id !== id)
}

async function saveFeatures() {
  saving.value = true

  try {
    await $fetch('/api/admin/features/features', {
      method: 'PUT',
      body: {
        features,
      },
    })
    await refresh()
    showSuccessToast('功能配置已保存')
  } catch (err) {
    showErrorToast('保存失败', getRequestErrorMessage(err, '保存失败'))
  } finally {
    saving.value = false
  }
}

const headerActions = computed(() => [
  {
    label: '保存功能配置',
    disabled: saving.value,
    onClick: saveFeatures,
  },
])

watch(error, (value) => {
  if (value) {
    showErrorToast('功能配置加载失败', value.message)
  }
}, { immediate: true })
</script>

<template>
  <div class="cms-page space-y-3">
    <AdminPageHeader title="功能管理" subtitle="" :actions="headerActions" />

    <div v-if="pending" class="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-card)] px-6 py-14 text-center text-sm text-[var(--text-secondary)]">
      正在加载功能配置...
    </div>

    <template v-else>
      <UiCard class="p-6">
        <p class="text-lg font-bold text-[var(--text-primary)]">
          Robots 管理
        </p>
        <p class="mt-1 text-sm text-[var(--text-secondary)]">
          保存 robots.txt 文本规则，后续可接入公开文件输出。
        </p>
        <UiTextarea v-model="features.robotsText" class="mt-4 min-h-44 font-mono" />
      </UiCard>

      <UiCard class="p-6">
        <p class="text-lg font-bold text-[var(--text-primary)]">
          Sitemap 管理
        </p>
        <div class="mt-4 grid gap-4 md:grid-cols-2">
          <label class="flex items-start gap-3 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-low)] px-4 py-4">
            <UiCheckbox v-model="features.sitemapEnabled" />
            <span class="text-sm font-medium text-[var(--text-primary)]">启用 Sitemap</span>
          </label>
          <select v-model="features.sitemapFormat" class="h-10 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-card)] px-3 text-sm text-[var(--text-primary)]">
            <option value="txt">TXT</option>
            <option value="xml">XML</option>
          </select>
        </div>
      </UiCard>

      <UiCard class="p-6">
        <p class="text-lg font-bold text-[var(--text-primary)]">
          搜索引擎推送
        </p>
        <div class="mt-4 grid gap-4 md:grid-cols-2">
          <UiInput v-model="features.baiduPushToken" placeholder="百度推送 Token" />
          <UiInput v-model="features.bingPushToken" placeholder="必应推送 Token" />
          <UiTextarea v-model="features.searchPushScript" placeholder="JS 推送代码" class="min-h-32 md:col-span-2 font-mono" />
        </div>
      </UiCard>

      <UiCard class="p-6">
        <div class="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p class="text-lg font-bold text-[var(--text-primary)]">
              友情链接
            </p>
            <p class="mt-1 text-sm text-[var(--text-secondary)]">
              维护友链标题、地址、排序和启用状态。
            </p>
          </div>
          <UiButton variant="secondary" size="sm" @click="addFriendLink">
            <Icon name="lucide:plus" class="size-4" />
            新增友链
          </UiButton>
        </div>

        <div class="space-y-3">
          <div
            v-for="link in features.friendLinks"
            :key="link.id"
            class="group relative rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-card)] p-3 transition-all hover:border-[var(--border-strong)] hover:shadow-sm"
          >
            <div class="grid gap-3 md:grid-cols-[1fr_1.4fr_6rem_auto] items-start">
              <UiInput v-model="link.title" variant="ghost" class="font-medium" placeholder="标题" />
              <UiInput v-model="link.url" variant="ghost" class="text-[var(--text-secondary)]" placeholder="https://example.com" />
              <UiInput v-model.number="link.order" variant="ghost" type="number" placeholder="排序" />
              <div class="flex items-center justify-end gap-3 px-2">
                <label class="flex cursor-pointer items-center gap-2">
                  <UiCheckbox v-model="link.enabled" />
                  <span class="text-sm text-[var(--text-secondary)]">显示</span>
                </label>
                <UiButton variant="ghost" size="icon" class="text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30" @click="removeFriendLink(link.id)">
                  <Icon name="lucide:trash-2" class="size-4" />
                </UiButton>
              </div>
              <UiTextarea v-model="link.description" variant="ghost" placeholder="说明" class="min-h-11 md:col-span-4 text-sm" />
            </div>
          </div>

          <div v-if="!features.friendLinks.length" class="rounded-xl border border-dashed border-[var(--border-soft)] px-4 py-8 text-center text-sm text-[var(--text-secondary)]">
            暂无友情链接。
          </div>
        </div>
      </UiCard>
    </template>
  </div>
</template>
