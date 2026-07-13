<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import type { TableColumn } from '@/components/ui/table'
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

const PAGE_SIZE = 20
const friendLinkColumns = [
  { prop: 'title', label: '标题', minWidth: 200 },
  { prop: 'url', label: '地址', minWidth: 280 },
  { prop: 'description', label: '说明', minWidth: 240 },
  { prop: 'order', label: '排序', width: 88 },
  { prop: 'enabled', label: '状态', width: 112 },
  { prop: 'actions', label: '操作', width: 104, align: 'right' },
] satisfies readonly TableColumn[]
const saving = ref(false)
const { showErrorToast } = useAdminToast()

const { data, pending, error, refresh } = await useFetch<{ features: FeatureSettings }>('/api/admin/features/features')

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
const currentPage = ref(1)
const dialogOpen = ref(false)
const editingFriendLinkId = ref('')
const friendLinkDraft = ref<FriendLinkItem | null>(null)
const friendLinkToDelete = ref<FriendLinkItem | null>(null)
let settingsDirty = false
let saveQueued = false
const {
  discardDialogOpen,
  captureDraft,
  requestClose: requestFriendLinkClose,
  handleOpenChange: handleFriendLinkDialogOpenChange,
  discardDraft,
} = useDialogDraftGuard(friendLinkDraft, closeFriendLinkDialogNow)

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

function createFriendLinkDraft(): FriendLinkItem {
  return {
    id: createLocalId('friend-link'),
    title: '',
    url: '',
    description: '',
    order: features.friendLinks.length + 1,
    enabled: true,
  }
}

const totalPages = computed(() => Math.max(1, Math.ceil(features.friendLinks.length / PAGE_SIZE)))
const paginatedFriendLinks = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return features.friendLinks.slice(start, start + PAGE_SIZE)
})

watch(totalPages, (value) => {
  currentPage.value = Math.min(currentPage.value, value)
})

function goToPage(page: number) {
  currentPage.value = Math.min(Math.max(page, 1), totalPages.value)
}

function openCreateFriendLinkDialog() {
  editingFriendLinkId.value = ''
  friendLinkDraft.value = createFriendLinkDraft()
  captureDraft()
  dialogOpen.value = true
}

function openEditFriendLinkDialog(item: FriendLinkItem) {
  editingFriendLinkId.value = item.id
  friendLinkDraft.value = { ...item }
  captureDraft()
  dialogOpen.value = true
}

function closeFriendLinkDialogNow() {
  dialogOpen.value = false
  editingFriendLinkId.value = ''
  friendLinkDraft.value = null
}

function submitFriendLink() {
  const draft = friendLinkDraft.value

  if (!draft) {
    return
  }

  const nextItem = {
    ...draft,
    title: draft.title.trim(),
    url: draft.url.trim(),
    description: draft.description.trim(),
    order: Number.isFinite(Number(draft.order)) ? Number(draft.order) : features.friendLinks.length + 1,
  }

  if (editingFriendLinkId.value) {
    features.friendLinks = features.friendLinks.map(item => item.id === editingFriendLinkId.value ? nextItem : item)
  } else {
    features.friendLinks = [...features.friendLinks, nextItem]
    currentPage.value = totalPages.value
  }

  closeFriendLinkDialogNow()
}

function requestFriendLinkRemoval(item: FriendLinkItem) {
  friendLinkToDelete.value = item
}

function handleFriendLinkDeleteOpenChange(value: boolean) {
  if (!value) {
    friendLinkToDelete.value = null
  }
}

function removeFriendLink() {
  const item = friendLinkToDelete.value

  if (!item) {
    return
  }

  features.friendLinks = features.friendLinks.filter(link => link.id !== item.id)
  currentPage.value = Math.min(currentPage.value, totalPages.value)
  friendLinkToDelete.value = null
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
  <div class="cms-page space-y-4">
    <AdminPageHeader title="功能管理" subtitle="Robots、Sitemap、搜索推送与友情链接" />

    <div v-if="pending" class="space-y-4" aria-label="正在加载功能配置">
      <UiSkeleton class="h-48 w-full" />
      <UiSkeleton class="h-56 w-full" />
      <UiSkeleton class="h-64 w-full" />
    </div>

    <template v-else>
      <UiAlert v-if="error" variant="destructive">
        <Icon name="lucide:circle-alert" />
        <UiAlertTitle>功能配置加载失败</UiAlertTitle>
        <UiAlertDescription>{{ error.message }}</UiAlertDescription>
        <UiAlertAction>
          <UiButton variant="outline" size="sm" @click="refresh">
            <Icon name="lucide:refresh-cw" class="size-4" />
            重试
          </UiButton>
        </UiAlertAction>
      </UiAlert>

      <UiCard class="p-6">
        <h2 class="text-base font-semibold text-[var(--text-primary)]">Robots 管理</h2>
        <p class="mt-1 text-sm text-[var(--text-secondary)]">
          保存 robots.txt 文本规则，后续可接入公开文件输出。
        </p>
        <UiLabel class="mt-4 block space-y-2">
          <span class="text-sm font-medium text-[var(--text-primary)]">规则内容</span>
          <UiTextarea v-model="features.robotsText" class="max-w-xl" />
        </UiLabel>
      </UiCard>

      <UiCard class="p-6">
        <h2 class="text-base font-semibold text-[var(--text-primary)]">Sitemap 管理</h2>
        <div class="mt-4 max-w-xl space-y-4">
          <UiLabel class="block space-y-2">
            <span class="block text-sm font-medium text-[var(--text-primary)]">启用状态</span>
            <span class="flex items-center gap-2">
              <UiCheckbox v-model="features.sitemapEnabled" aria-label="启用 Sitemap" />
              <span class="text-sm text-[var(--text-secondary)]">启用 Sitemap 输出</span>
            </span>
          </UiLabel>
          <UiLabel class="block space-y-2">
            <span class="block text-sm font-medium text-[var(--text-primary)]">输出格式</span>
            <UiSelect v-model="features.sitemapFormat">
              <UiSelectTrigger class="w-full max-w-xl">
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
        <h2 class="text-base font-semibold text-[var(--text-primary)]">搜索引擎推送</h2>
        <div class="mt-4 space-y-4">
          <UiLabel class="block space-y-2">
            <span class="text-sm font-medium text-[var(--text-primary)]">百度 Token</span>
            <UiInput v-model="features.baiduPushToken" class="w-full max-w-xl" placeholder="百度推送 Token" />
          </UiLabel>
          <UiLabel class="block space-y-2">
            <span class="text-sm font-medium text-[var(--text-primary)]">必应 Token</span>
            <UiInput v-model="features.bingPushToken" class="w-full max-w-xl" placeholder="必应推送 Token" />
          </UiLabel>
          <UiLabel class="block space-y-2">
            <span class="text-sm font-medium text-[var(--text-primary)]">推送代码</span>
            <UiTextarea v-model="features.searchPushScript" class="max-w-xl" placeholder="JS 推送代码" />
          </UiLabel>
        </div>
      </UiCard>

      <UiCard class="overflow-hidden p-0">
        <div class="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-soft)] px-5 py-4">
          <div>
            <h2 class="text-base font-semibold text-[var(--text-primary)]">友情链接</h2>
            <p class="mt-1 text-sm text-[var(--text-secondary)]">
              维护友链标题、地址、排序和启用状态。
            </p>
          </div>
          <UiButton variant="secondary" size="sm" @click="openCreateFriendLinkDialog">
            <Icon name="lucide:plus" class="size-4" />
            新增友链
          </UiButton>
        </div>

        <UiTable
          class="min-w-[960px]"
          :columns="friendLinkColumns"
          :items="paginatedFriendLinks"
          row-key="id"
          :error="error?.message"
          empty-text="暂无友情链接"
          pagination
          :page="currentPage"
          :items-per-page="PAGE_SIZE"
          :total="features.friendLinks.length"
          @retry="refresh"
          @update:page="goToPage"
        >
          <template #cell-title="{ item }">
            <span class="font-medium text-[var(--text-primary)]">{{ item.title }}</span>
          </template>
          <template #cell-url="{ item }">
            <a :href="item.url" target="_blank" rel="noopener noreferrer" class="text-sm text-[var(--primary)] hover:underline">
              {{ item.url }}
            </a>
          </template>
          <template #cell-description="{ item }">
            <p class="line-clamp-2 text-xs leading-5 text-[var(--text-secondary)]">{{ item.description || '暂无说明' }}</p>
          </template>
          <template #cell-order="{ item }">
            <span class="tabular-nums text-[var(--text-secondary)]">{{ item.order }}</span>
          </template>
          <template #cell-enabled="{ item }">
            <UiLabel class="inline-flex items-center gap-2">
              <UiCheckbox v-model="item.enabled" :disabled="saving" />
              <span class="text-xs text-[var(--text-secondary)]">{{ item.enabled ? '显示' : '隐藏' }}</span>
            </UiLabel>
          </template>
          <template #cell-actions="{ item }">
            <div class="flex justify-end gap-1">
              <UiTooltip>
                <UiTooltipTrigger as-child>
                  <UiButton variant="ghost" size="icon-sm" :disabled="saving" aria-label="编辑友链" @click="openEditFriendLinkDialog(item)">
                    <Icon name="lucide:pencil" class="size-4" />
                  </UiButton>
                </UiTooltipTrigger>
                <UiTooltipContent>编辑友链</UiTooltipContent>
              </UiTooltip>
              <UiTooltip>
                <UiTooltipTrigger as-child>
                  <UiButton variant="ghost" size="icon-sm" :disabled="saving" aria-label="删除友链" @click="requestFriendLinkRemoval(item)">
                    <Icon name="lucide:trash-2" class="size-4 text-[var(--danger)]" />
                  </UiButton>
                </UiTooltipTrigger>
                <UiTooltipContent>删除友链</UiTooltipContent>
              </UiTooltip>
            </div>
          </template>
        </UiTable>
      </UiCard>
    </template>

    <UiDialog :open="dialogOpen" @update:open="handleFriendLinkDialogOpenChange">
      <UiDialogContent size="md">
        <form v-if="friendLinkDraft" class="space-y-6" @submit.prevent="submitFriendLink">
          <UiDialogHeader>
            <UiDialogTitle>{{ editingFriendLinkId ? '编辑友链' : '新增友链' }}</UiDialogTitle>
            <UiDialogDescription>维护友链标题、地址、说明和展示状态。</UiDialogDescription>
          </UiDialogHeader>

          <div class="space-y-4 overflow-y-auto">
            <UiLabel class="block space-y-2">
              <span class="text-sm font-medium text-[var(--text-primary)]">标题</span>
              <UiInput v-model="friendLinkDraft.title" class="w-full max-w-xl" placeholder="网站名称" required />
            </UiLabel>
            <UiLabel class="block space-y-2">
              <span class="text-sm font-medium text-[var(--text-primary)]">地址</span>
              <UiInput v-model="friendLinkDraft.url" class="w-full max-w-xl" type="url" placeholder="https://example.com" required />
            </UiLabel>
            <UiLabel class="block space-y-2">
              <span class="text-sm font-medium text-[var(--text-primary)]">说明</span>
              <UiTextarea v-model="friendLinkDraft.description" class="max-w-xl" placeholder="友链说明（可选）" />
            </UiLabel>
            <UiLabel class="block space-y-2">
              <span class="text-sm font-medium text-[var(--text-primary)]">排序</span>
              <UiInput v-model.number="friendLinkDraft.order" class="w-full max-w-xl" type="number" min="1" />
            </UiLabel>
            <UiLabel class="flex items-center gap-2">
              <UiCheckbox v-model="friendLinkDraft.enabled" />
              <span class="text-sm font-medium text-[var(--text-primary)]">在前台显示</span>
            </UiLabel>
          </div>

          <UiDialogFooter>
            <UiButton type="button" variant="outline" @click="requestFriendLinkClose">取消</UiButton>
            <UiButton type="submit">
              <Icon name="lucide:save" class="size-4" />
              保存友链
            </UiButton>
          </UiDialogFooter>
        </form>
      </UiDialogContent>
    </UiDialog>

    <AdminDiscardChangesDialog v-model:open="discardDialogOpen" @confirm="discardDraft" />

    <UiAlertDialog :open="Boolean(friendLinkToDelete)" @update:open="handleFriendLinkDeleteOpenChange">
      <UiAlertDialogContent>
        <UiAlertDialogHeader>
          <UiAlertDialogTitle>删除友链“{{ friendLinkToDelete?.title }}”？</UiAlertDialogTitle>
          <UiAlertDialogDescription>删除后将通过自动保存提交，无法在页面内撤销。</UiAlertDialogDescription>
        </UiAlertDialogHeader>
        <UiAlertDialogFooter>
          <UiAlertDialogCancel>取消</UiAlertDialogCancel>
          <UiAlertDialogAction variant="destructive" @click="removeFriendLink">确认删除</UiAlertDialogAction>
        </UiAlertDialogFooter>
      </UiAlertDialogContent>
    </UiAlertDialog>
  </div>
</template>
