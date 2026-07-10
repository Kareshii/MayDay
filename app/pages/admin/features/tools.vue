<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import type { HomeGalleryItem } from '~~/shared/types/gallery'

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
  galleryEnabled: boolean
  galleryTitle: string
  gallerySubtitle: string
  galleryItems: HomeGalleryItem[]
}

definePageMeta({
  layout: 'admin',
})

useSeoMeta({
  title: '功能管理',
  description: '管理 Robots、Sitemap、友情链接和搜索推送配置。',
})

const saving = ref(false)
const { showErrorToast } = useAdminToast()

const { data, pending, error } = await useFetch<{ features: FeatureSettings }>('/api/admin/features/features')

const features = reactive<FeatureSettings>({
  robotsText: '',
  sitemapEnabled: true,
  sitemapFormat: 'txt',
  baiduPushToken: '',
  bingPushToken: '',
  searchPushScript: '',
  friendLinks: [],
  galleryEnabled: true,
  galleryTitle: '图册',
  gallerySubtitle: '',
  galleryItems: [],
})
const settingsHydrated = ref(false)
let settingsDirty = false
let saveQueued = false

const autoSaveFeatures = useDebounceFn(async () => {
  await persistFeatures()
}, 500, { maxWait: 1500 })

watch(data, (value) => {
  if (!value?.features) {
    return
  }

  settingsHydrated.value = false
  Object.assign(features, {
    ...value.features,
    friendLinks: value.features.friendLinks.map(item => ({ ...item })),
    galleryItems: value.features.galleryItems.map(item => ({
      ...item,
      images: [...item.images],
    })),
  })
  void nextTick(() => {
    settingsHydrated.value = true
  })
}, { immediate: true })

watch(features, () => {
  if (!settingsHydrated.value) {
    return
  }

  settingsDirty = true
  void autoSaveFeatures()
}, { deep: 3 })

function createLocalId(prefix: string) {
  return globalThis.crypto?.randomUUID?.() || `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function addFriendLink() {
  features.friendLinks.push({
    id: createLocalId('friend-link'),
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

async function persistFeatures() {
  if (saving.value) {
    saveQueued = true
    return
  }

  do {
    saveQueued = false
    saving.value = true
    settingsDirty = false

    try {
      const payload: FeatureSettings = {
        ...features,
        friendLinks: features.friendLinks.map(item => ({ ...item })),
        galleryItems: features.galleryItems.map(item => ({
          ...item,
          images: [...item.images],
        })),
      }

      await $fetch('/api/admin/features/features', {
        method: 'PUT',
        body: {
          features: payload,
        },
      })
    } catch (err) {
      settingsDirty = true
      showErrorToast('保存失败', getRequestErrorMessage(err, '保存失败'))
    } finally {
      saving.value = false
    }
  } while (saveQueued)
}

onBeforeUnmount(() => {
  if (settingsDirty) {
    void persistFeatures()
  }
})

watch(error, (value) => {
  if (value) {
    showErrorToast('功能配置加载失败', value.message)
  }
}, { immediate: true })
</script>

<template>
  <div class="cms-page space-y-3">
    <AdminPageHeader title="功能管理" subtitle="" />

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
        <UiLabel class="mt-4 grid gap-3 md:grid-cols-[10rem_minmax(0,1fr)] md:items-start md:gap-6">
          <span class="pt-3 text-sm font-medium text-[var(--text-primary)]">规则内容</span>
          <UiTextarea v-model="features.robotsText" class="min-h-44 font-mono" />
        </UiLabel>
      </UiCard>

      <UiCard class="p-6">
        <p class="text-lg font-bold text-[var(--text-primary)]">
          Sitemap 管理
        </p>
        <div class="mt-4 divide-y divide-[var(--border-soft)]">
          <UiLabel class="grid gap-3 py-4 md:grid-cols-[10rem_minmax(0,1fr)] md:items-center md:gap-6">
            <span class="text-sm font-medium text-[var(--text-primary)]">启用状态</span>
            <span class="flex items-center gap-3">
              <UiCheckbox v-model="features.sitemapEnabled" />
              <span class="text-sm text-[var(--text-secondary)]">Sitemap</span>
            </span>
          </UiLabel>
          <UiLabel class="grid gap-3 py-4 md:grid-cols-[10rem_minmax(0,1fr)] md:items-center md:gap-6">
            <span class="text-sm font-medium text-[var(--text-primary)]">输出格式</span>
            <UiSelect v-model="features.sitemapFormat">
              <UiSelectTrigger class="border-[var(--border-soft)]">
                <UiSelectValue placeholder="Sitemap 格式" />
              </UiSelectTrigger>
              <UiSelectContent>
                <UiSelectItem value="txt">TXT</UiSelectItem>
                <UiSelectItem value="xml">XML</UiSelectItem>
              </UiSelectContent>
            </UiSelect>
          </UiLabel>
        </div>
      </UiCard>

      <UiCard class="p-6">
        <p class="text-lg font-bold text-[var(--text-primary)]">
          搜索引擎推送
        </p>
        <div class="mt-4 divide-y divide-[var(--border-soft)]">
          <UiLabel class="grid gap-3 py-4 md:grid-cols-[10rem_minmax(0,1fr)] md:items-center md:gap-6">
            <span class="text-sm font-medium text-[var(--text-primary)]">百度 Token</span>
            <UiInput v-model="features.baiduPushToken" placeholder="百度推送 Token" />
          </UiLabel>
          <UiLabel class="grid gap-3 py-4 md:grid-cols-[10rem_minmax(0,1fr)] md:items-center md:gap-6">
            <span class="text-sm font-medium text-[var(--text-primary)]">必应 Token</span>
            <UiInput v-model="features.bingPushToken" placeholder="必应推送 Token" />
          </UiLabel>
          <UiLabel class="grid gap-3 py-4 md:grid-cols-[10rem_minmax(0,1fr)] md:items-start md:gap-6">
            <span class="pt-3 text-sm font-medium text-[var(--text-primary)]">推送代码</span>
            <UiTextarea v-model="features.searchPushScript" placeholder="JS 推送代码" class="min-h-32 font-mono" />
          </UiLabel>
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
                <UiLabel class="flex cursor-pointer items-center gap-2">
                  <UiCheckbox v-model="link.enabled" />
                  <span class="text-sm text-[var(--text-secondary)]">显示</span>
                </UiLabel>
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
