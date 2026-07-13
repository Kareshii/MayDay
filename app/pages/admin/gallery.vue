<script setup lang="ts">
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

interface GalleryFormState extends HomeGalleryItem {
  imagesText: string
}

type GalleryStatusFilter = 'all' | 'enabled' | 'hidden'

definePageMeta({
  layout: 'admin',
})

useSeoMeta({
  title: '图册管理',
  description: '管理首页图册内容。',
})

const PAGE_SIZE = 20
const galleryColumns = [
  { prop: 'cover', label: '封面', width: 112, headerClass: 'px-5', cellClass: 'px-5 py-3' },
  { prop: 'info', label: '图册信息', minWidth: 320, cellClass: 'py-3' },
  { prop: 'category', label: '分类', width: 144 },
  { prop: 'images', label: '图片数', width: 112, cellClass: 'text-sm tabular-nums text-[var(--text-secondary)]', formatter: (_item, _column, value) => Array.isArray(value) ? value.length : 0 },
  { prop: 'order', label: '排序', width: 96 },
  { prop: 'status', label: '状态', width: 112 },
  { prop: 'actions', label: '操作', width: 96, align: 'right', headerClass: 'px-5', cellClass: 'px-5' },
] satisfies readonly TableColumn[]

const saving = ref(false)
const dialogOpen = ref(false)
const deleteDialogOpen = ref(false)
const deleteTarget = ref<HomeGalleryItem | null>(null)
const isEditing = ref(false)
const currentPage = ref(1)
const searchInput = ref('')
const statusFilter = ref<GalleryStatusFilter>('all')
const { showSuccessToast, showErrorToast } = useAdminToast()

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

function createLocalId(prefix: string) {
  return globalThis.crypto?.randomUUID?.() || `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function createEmptyGalleryForm(): GalleryFormState {
  return {
    id: createLocalId('gallery'),
    title: '',
    category: 'GALLERY',
    image: '/cover.jpg',
    description: '',
    content: '',
    images: ['/cover.jpg'],
    imagesText: '/cover.jpg',
    order: features.galleryItems.length + 1,
    enabled: true,
  }
}

const currentGallery = ref<GalleryFormState>(createEmptyGalleryForm())
const {
  discardDialogOpen,
  captureDraft,
  handleOpenChange: handleGalleryDialogOpenChange,
  discardDraft,
} = useDialogDraftGuard(currentGallery, closeGalleryDialogNow, () => saving.value)

function applyFeatures(value: FeatureSettings) {
  Object.assign(features, {
    ...value,
    friendLinks: Array.isArray(value.friendLinks)
      ? value.friendLinks.map(item => ({ ...item }))
      : [],
    galleryItems: Array.isArray(value.galleryItems)
      ? value.galleryItems.map(item => ({
          ...item,
          images: Array.isArray(item.images) ? [...item.images] : [],
        }))
      : [],
  })
}

watch(data, (value) => {
  if (!value?.features) {
    return
  }

  applyFeatures(value.features)
}, { immediate: true })

const sortedGalleryItems = computed(() => {
  return [...features.galleryItems].sort((left, right) => left.order - right.order || left.title.localeCompare(right.title))
})
const filteredGalleryItems = computed(() => {
  const keyword = searchInput.value.trim().toLocaleLowerCase('zh-CN')

  return sortedGalleryItems.value.filter((item) => {
    if (statusFilter.value === 'enabled' && !item.enabled) {
      return false
    }

    if (statusFilter.value === 'hidden' && item.enabled) {
      return false
    }

    if (!keyword) {
      return true
    }

    return [item.title, item.description, item.category]
      .join(' ')
      .toLocaleLowerCase('zh-CN')
      .includes(keyword)
  })
})
const totalPages = computed(() => Math.max(1, Math.ceil(filteredGalleryItems.value.length / PAGE_SIZE)))
const paginatedGalleryItems = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredGalleryItems.value.slice(start, start + PAGE_SIZE)
})
watch([searchInput, statusFilter], () => {
  currentPage.value = 1
})
watch(totalPages, (value) => {
  currentPage.value = Math.min(currentPage.value, value)
})

function goToPage(nextPage: number) {
  currentPage.value = Math.min(Math.max(1, nextPage), totalPages.value)
}

const headerActions = computed(() => [
  {
    label: '新增图册',
    icon: 'lucide:plus',
    variant: 'default' as const,
    disabled: saving.value || pending.value,
    onClick: openCreateDialog,
  },
])

watch(error, (value) => {
  if (value) {
    showErrorToast('图册加载失败', value.message)
  }
}, { immediate: true })

function openCreateDialog() {
  currentGallery.value = createEmptyGalleryForm()
  isEditing.value = false
  captureDraft()
  dialogOpen.value = true
}

function openEditDialog(item: HomeGalleryItem) {
  currentGallery.value = {
    ...item,
    images: [...item.images],
    imagesText: item.images.join('\n'),
  }
  isEditing.value = true
  captureDraft()
  dialogOpen.value = true
}

function closeGalleryDialogNow() {
  dialogOpen.value = false
}

function normalizeGalleryForm() {
  const image = currentGallery.value.image.trim() || '/cover.jpg'
  const images = currentGallery.value.imagesText
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
  const order = Number(currentGallery.value.order)

  return {
    id: currentGallery.value.id,
    title: currentGallery.value.title.trim(),
    category: currentGallery.value.category.trim() || 'GALLERY',
    image,
    description: currentGallery.value.description.trim(),
    content: currentGallery.value.content.trim(),
    images: images.length ? images : [image],
    order: Number.isFinite(order) ? order : features.galleryItems.length + 1,
    enabled: currentGallery.value.enabled,
  }
}

async function submitGallery() {
  const item = normalizeGalleryForm()

  if (!item.title) {
    showErrorToast('提示', '图册标题不能为空')
    return
  }

  let nextGalleryItems: HomeGalleryItem[]

  if (isEditing.value) {
    const index = features.galleryItems.findIndex(galleryItem => galleryItem.id === item.id)

    if (index === -1) {
      showErrorToast('保存失败', '图册不存在或已被删除')
      return
    }

    nextGalleryItems = features.galleryItems.map(galleryItem => galleryItem.id === item.id ? item : galleryItem)
  } else {
    nextGalleryItems = [...features.galleryItems, item]
  }

  const saved = await persistGallery(
    { galleryItems: nextGalleryItems },
    isEditing.value ? '图册已更新' : '图册已创建',
  )

  if (saved) {
    currentPage.value = isEditing.value ? currentPage.value : totalPages.value
    closeGalleryDialogNow()
  }
}

function requestRemoveGalleryItem(item: HomeGalleryItem) {
  deleteTarget.value = item
  deleteDialogOpen.value = true
}

function handleDeleteDialogOpenChange(open: boolean) {
  if (!open && saving.value) {
    return
  }

  deleteDialogOpen.value = open

  if (!open) {
    deleteTarget.value = null
  }
}

async function removeGalleryItem(id: string) {
  if (saving.value) {
    return
  }

  const saved = await persistGallery(
    { galleryItems: features.galleryItems.filter(item => item.id !== id) },
    '图册已删除',
  )

  if (saved) {
    deleteDialogOpen.value = false
    deleteTarget.value = null
  }
}

async function persistGallery(
  changes: Partial<Pick<FeatureSettings, 'galleryEnabled' | 'galleryTitle' | 'gallerySubtitle' | 'galleryItems'>>,
  successMessage: string,
) {
  if (saving.value) {
    return false
  }

  saving.value = true

  try {
    const nextFeatures: FeatureSettings = {
      ...features,
      ...changes,
      friendLinks: features.friendLinks.map(item => ({ ...item })),
      galleryItems: (changes.galleryItems || features.galleryItems).map(item => ({
        ...item,
        images: [...item.images],
      })),
    }
    const response = await $fetch<{ features: FeatureSettings }>('/api/admin/features/features', {
      method: 'PUT',
      body: {
        features: nextFeatures,
      },
    })

    applyFeatures(response.features)
    showSuccessToast(successMessage)
    return true
  } catch (err) {
    showErrorToast('保存失败', getRequestErrorMessage(err, '保存失败'))
    return false
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="cms-page space-y-4">
    <AdminPageHeader title="图册管理" subtitle="管理首页图册内容" :actions="headerActions" />

    <UiCard class="overflow-hidden p-0">
        <div v-if="!pending && !error" class="flex flex-col items-stretch gap-3 border-b border-[var(--border-soft)] p-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-5 lg:p-5">
          <div class="flex shrink-0 items-center gap-2">
            <UiLabel for="gallery-search" class="shrink-0 text-sm font-medium text-[var(--text-secondary)]">
              搜索
            </UiLabel>
            <div class="w-[min(20rem,70vw)]">
              <UiInput
                id="gallery-search"
                v-model="searchInput"
                type="search"
                placeholder="搜索标题、描述或分类"
                class="max-w-none"
              />
            </div>
          </div>

          <div class="flex shrink-0 items-center gap-2">
            <UiLabel for="gallery-status-filter" class="shrink-0 text-sm font-medium text-[var(--text-secondary)]">
              状态
            </UiLabel>
            <UiSelect v-model="statusFilter">
              <UiSelectTrigger id="gallery-status-filter" class="w-[min(120px,60vw)]">
                <UiSelectValue placeholder="全部状态" />
              </UiSelectTrigger>
              <UiSelectContent>
                <UiSelectItem value="all">全部状态</UiSelectItem>
                <UiSelectItem value="enabled">显示</UiSelectItem>
                <UiSelectItem value="hidden">隐藏</UiSelectItem>
              </UiSelectContent>
            </UiSelect>
          </div>

          <div class="flex h-9 shrink-0 items-center text-xs text-[var(--text-secondary)]">
            共 <strong class="mx-1 font-semibold tabular-nums text-[var(--text-primary)]">{{ filteredGalleryItems.length }}</strong> 个
          </div>
        </div>

        <UiTable
          class="min-w-[960px]"
          :columns="galleryColumns"
          :items="paginatedGalleryItems"
          row-key="id"
          :loading="pending"
          loading-text="正在加载图册"
          :error="error?.message"
          empty-text="没有符合条件的图册，请调整搜索或状态筛选"
          pagination
          :page="currentPage"
          :items-per-page="PAGE_SIZE"
          :total="filteredGalleryItems.length"
          @retry="refresh"
          @update:page="goToPage"
        >
            <template #cell-cover="{ item }">
              <div class="size-14 overflow-hidden rounded-md border border-[var(--border-soft)] bg-[var(--surface-low)]">
                <img
                  :src="item.image || '/cover.jpg'"
                  :alt="item.title"
                  :class="['h-full w-full object-cover', !item.enabled && 'grayscale-[0.65] opacity-70']"
                  loading="lazy"
                >
              </div>
            </template>

            <template #cell-info="{ item }">
              <p class="max-w-[28rem] truncate text-sm font-semibold text-[var(--text-primary)]" :title="item.title || '未命名图册'">
                {{ item.title || '未命名图册' }}
              </p>
              <p class="mt-1 max-w-[34rem] truncate text-xs text-[var(--text-secondary)]" :title="item.description || item.image">
                {{ item.description || item.image }}
              </p>
            </template>

            <template #cell-category="{ item }">
              <UiBadge variant="secondary" class="normal-case tracking-[0]">
                {{ item.category || 'GALLERY' }}
              </UiBadge>
            </template>

            <template #cell-order="{ item }">
              <span class="inline-grid size-7 place-items-center rounded-md border border-[var(--border-soft)] text-xs font-semibold tabular-nums text-[var(--text-secondary)]">
                {{ item.order }}
              </span>
            </template>

            <template #cell-status="{ item }">
              <UiBadge :variant="item.enabled ? 'success' : 'secondary'" class="normal-case tracking-[0]">
                <span class="mr-1 size-1.5 rounded-full bg-current" />
                {{ item.enabled ? '显示' : '隐藏' }}
              </UiBadge>
            </template>

            <template #cell-actions="{ item }">
              <div class="flex items-center justify-end gap-1">
                <UiTooltip>
                  <UiTooltipTrigger as-child>
                    <UiButton
                      variant="ghost"
                      size="icon-sm"
                      :disabled="saving"
                      aria-label="编辑图册"
                      @click="openEditDialog(item)"
                    >
                      <Icon name="lucide:pencil" class="size-4" />
                    </UiButton>
                  </UiTooltipTrigger>
                  <UiTooltipContent>编辑图册</UiTooltipContent>
                </UiTooltip>

                <UiTooltip>
                  <UiTooltipTrigger as-child>
                    <UiButton variant="ghost" size="icon-sm" :disabled="saving" aria-label="删除图册" @click="requestRemoveGalleryItem(item)">
                      <Icon name="lucide:trash-2" class="size-4 text-[var(--danger)]" />
                    </UiButton>
                  </UiTooltipTrigger>
                  <UiTooltipContent>删除图册</UiTooltipContent>
                </UiTooltip>
              </div>
            </template>
        </UiTable>
    </UiCard>

    <UiDialog :open="dialogOpen" @update:open="handleGalleryDialogOpenChange">
      <UiDialogContent size="xl" :show-close-button="false" class="gap-0 p-0">
        <form class="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto]" @submit.prevent="submitGallery">
          <div class="flex items-center justify-between gap-4 border-b border-[var(--border-soft)] px-5 py-4 sm:px-6">
            <UiDialogHeader>
              <UiDialogTitle>{{ isEditing ? '编辑图册' : '新建图册' }}</UiDialogTitle>
              <UiDialogDescription>{{ currentGallery.title || '填写图册内容与展示设置' }}</UiDialogDescription>
            </UiDialogHeader>
            <UiTooltip>
              <UiTooltipTrigger as-child>
                <UiDialogClose as-child>
                  <UiButton type="button" variant="ghost" size="icon-sm" aria-label="关闭弹窗" :disabled="saving">
                    <Icon name="lucide:x" class="size-4" />
                  </UiButton>
                </UiDialogClose>
              </UiTooltipTrigger>
              <UiTooltipContent>关闭</UiTooltipContent>
            </UiTooltip>
          </div>

          <div class="min-h-0 max-w-xl space-y-8 overflow-y-auto p-5 sm:p-6">
            <section class="space-y-4">
              <h3 class="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                <Icon name="lucide:info" class="size-4 text-[var(--primary)]" />
                基本信息
              </h3>

              <UiLabel class="block space-y-2">
                <span class="text-xs font-medium text-[var(--text-secondary)]">标题 <span class="text-destructive">*</span></span>
                <UiInput v-model="currentGallery.title" :disabled="saving" required placeholder="例如：舞台光" class="max-w-none" />
              </UiLabel>

              <UiLabel class="block space-y-2">
                <span class="text-xs font-medium text-[var(--text-secondary)]">分类</span>
                <UiInput v-model="currentGallery.category" :disabled="saving" placeholder="例如：LIVE" class="max-w-none" />
              </UiLabel>

              <UiLabel class="block space-y-2">
                <span class="text-xs font-medium text-[var(--text-secondary)]">封面图片</span>
                <UiInput v-model="currentGallery.image" :disabled="saving" placeholder="/cover.jpg 或 https://..." class="max-w-none" />
              </UiLabel>

              <div class="aspect-[16/7] overflow-hidden rounded-md border border-[var(--border-soft)] bg-[var(--surface-low)]">
                <img :src="currentGallery.image || '/cover.jpg'" :alt="currentGallery.title || '图册封面预览'" class="size-full object-cover">
              </div>

              <UiLabel class="block space-y-2">
                <span class="text-xs font-medium text-[var(--text-secondary)]">描述</span>
                <UiTextarea v-model="currentGallery.description" :disabled="saving" placeholder="卡片上的简短说明" />
              </UiLabel>
            </section>

            <UiSeparator />

            <section class="space-y-4">
              <h3 class="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                <Icon name="lucide:images" class="size-4 text-[var(--primary)]" />
                图册内容
              </h3>

              <UiLabel class="block space-y-2">
                <span class="text-xs font-medium text-[var(--text-secondary)]">图片列表 <span class="font-normal text-[var(--text-muted)]">(每行一个图片地址)</span></span>
                <UiTextarea v-model="currentGallery.imagesText" :disabled="saving" placeholder="https://..." />
              </UiLabel>

              <UiLabel class="block space-y-2">
                <span class="text-xs font-medium text-[var(--text-secondary)]">展开正文 <span class="font-normal text-[var(--text-muted)]">(可选)</span></span>
                <UiTextarea v-model="currentGallery.content" :disabled="saving" placeholder="点击图册卡片后展示的正文" />
              </UiLabel>
            </section>

            <UiSeparator />

            <section class="space-y-4">
              <h3 class="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                <Icon name="lucide:monitor" class="size-4 text-[var(--primary)]" />
                展示设置
              </h3>

              <UiLabel class="block space-y-2">
                <span class="text-xs font-medium text-[var(--text-secondary)]">排序</span>
                <UiInput v-model.number="currentGallery.order" :disabled="saving" type="number" min="1" class="max-w-none" />
              </UiLabel>

              <UiLabel class="block space-y-2">
                <span class="text-xs font-medium text-[var(--text-secondary)]">显示状态</span>
                <span class="flex cursor-pointer items-center gap-3 py-2">
                  <UiCheckbox v-model="currentGallery.enabled" :disabled="saving" />
                  <span class="text-sm font-medium text-[var(--text-primary)]">前台显示</span>
                </span>
              </UiLabel>
            </section>
          </div>

          <UiDialogFooter class="border-t border-[var(--border-soft)] px-5 py-4 sm:px-6">
            <UiDialogClose as-child>
              <UiButton type="button" variant="outline" :disabled="saving">取消</UiButton>
            </UiDialogClose>
            <UiButton type="submit" :disabled="saving">
              <Icon :name="saving ? 'lucide:loader-circle' : isEditing ? 'lucide:save' : 'lucide:plus'" :class="['size-4', saving && 'animate-spin']" />
              {{ saving ? '保存中...' : isEditing ? '更新图册' : '添加图册' }}
            </UiButton>
          </UiDialogFooter>
        </form>
      </UiDialogContent>
    </UiDialog>

    <AdminDiscardChangesDialog v-model:open="discardDialogOpen" @confirm="discardDraft" />

    <UiAlertDialog :open="deleteDialogOpen" @update:open="handleDeleteDialogOpenChange">
      <UiAlertDialogContent>
        <UiAlertDialogHeader>
          <UiAlertDialogTitle>删除图册？</UiAlertDialogTitle>
          <UiAlertDialogDescription>
            将永久删除“{{ deleteTarget?.title || '未命名图册' }}”，首页将不再展示该图册。
          </UiAlertDialogDescription>
        </UiAlertDialogHeader>
        <UiAlertDialogFooter>
          <UiAlertDialogCancel :disabled="saving">取消</UiAlertDialogCancel>
          <UiAlertDialogAction
            variant="destructive"
            class="min-w-24"
            :disabled="!deleteTarget || saving"
            @click.prevent="deleteTarget && removeGalleryItem(deleteTarget.id)"
          >
            <Icon v-if="saving" name="lucide:loader-circle" class="size-4 animate-spin" />
            {{ saving ? '删除中...' : '删除图册' }}
          </UiAlertDialogAction>
        </UiAlertDialogFooter>
      </UiAlertDialogContent>
    </UiAlertDialog>
  </div>
</template>
