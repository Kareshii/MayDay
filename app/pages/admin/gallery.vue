<script setup lang="ts">
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from 'reka-ui'
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

definePageMeta({
  layout: 'admin',
})

useSeoMeta({
  title: '图册管理',
  description: '管理首页图册内容。',
})

const PAGE_SIZE = 20

const saving = ref(false)
const dialogOpen = ref(false)
const isEditing = ref(false)
const currentPage = ref(1)
const { showSuccessToast, showErrorToast } = useAdminToast()

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

const enabledGalleryItems = computed(() => features.galleryItems.filter(item => item.enabled))
const hiddenGalleryItems = computed(() => features.galleryItems.length - enabledGalleryItems.value.length)
const totalGalleryImages = computed(() => {
  return features.galleryItems.reduce((total, item) => total + item.images.length, 0)
})
const sortedGalleryItems = computed(() => {
  return [...features.galleryItems].sort((left, right) => left.order - right.order || left.title.localeCompare(right.title))
})
const totalPages = computed(() => Math.max(1, Math.ceil(sortedGalleryItems.value.length / PAGE_SIZE)))
const paginatedGalleryItems = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return sortedGalleryItems.value.slice(start, start + PAGE_SIZE)
})
const pageStart = computed(() => {
  if (!sortedGalleryItems.value.length) {
    return 0
  }

  return (currentPage.value - 1) * PAGE_SIZE + 1
})
const pageEnd = computed(() => Math.min(currentPage.value * PAGE_SIZE, sortedGalleryItems.value.length))

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
  dialogOpen.value = true
}

function openEditDialog(item: HomeGalleryItem) {
  currentGallery.value = {
    ...item,
    images: [...item.images],
    imagesText: item.images.join('\n'),
  }
  isEditing.value = true
  dialogOpen.value = true
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
    dialogOpen.value = false
  }
}

async function removeGalleryItem(id: string) {
  if (saving.value) {
    return
  }

  if (import.meta.client && !window.confirm('确认删除这个图册吗？')) {
    return
  }

  await persistGallery(
    { galleryItems: features.galleryItems.filter(item => item.id !== id) },
    '图册已删除',
  )
}

async function saveGallerySettings() {
  await persistGallery({}, '图册设置已自动保存')
}

async function updateGalleryEnabled(value: boolean) {
  if (saving.value || value === features.galleryEnabled) {
    return
  }

  const previousValue = features.galleryEnabled
  features.galleryEnabled = value

  const saved = await persistGallery({}, value ? '图册区块已启用' : '图册区块已隐藏')

  if (!saved) {
    features.galleryEnabled = previousValue
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
    <AdminPageHeader title="图册管理" subtitle="首页图册与展示设置" :actions="headerActions" />

    <div v-if="pending" class="flex min-h-56 items-center justify-center rounded-lg border border-[var(--border-soft)] bg-[var(--surface-card)]">
      <div class="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
        <Icon name="lucide:loader-circle" class="size-4 animate-spin text-[var(--primary)]" />
        正在加载图册
      </div>
    </div>

    <template v-else>
      <section class="grid overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--surface-card)] sm:grid-cols-3">
        <div class="flex min-h-28 items-center gap-4 border-b border-[var(--border-soft)] px-5 py-4 sm:border-b-0 sm:border-r">
          <div class="grid size-10 shrink-0 place-items-center rounded-md bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300">
            <Icon name="lucide:library" class="size-5" />
          </div>
          <div>
            <p class="text-xs font-medium text-[var(--text-secondary)]">图册总数</p>
            <p class="mt-1 text-2xl font-bold tabular-nums text-[var(--text-primary)]">{{ features.galleryItems.length }}</p>
          </div>
        </div>
        <div class="flex min-h-28 items-center gap-4 border-b border-[var(--border-soft)] px-5 py-4 sm:border-b-0 sm:border-r">
          <div class="grid size-10 shrink-0 place-items-center rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
            <Icon name="lucide:eye" class="size-5" />
          </div>
          <div>
            <p class="text-xs font-medium text-[var(--text-secondary)]">前台显示</p>
            <p class="mt-1 text-2xl font-bold tabular-nums text-[var(--text-primary)]">{{ enabledGalleryItems.length }}</p>
          </div>
        </div>
        <div class="flex min-h-28 items-center gap-4 px-5 py-4">
          <div class="grid size-10 shrink-0 place-items-center rounded-md bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
            <Icon name="lucide:image" class="size-5" />
          </div>
          <div>
            <p class="text-xs font-medium text-[var(--text-secondary)]">收录图片</p>
            <p class="mt-1 text-2xl font-bold tabular-nums text-[var(--text-primary)]">{{ totalGalleryImages }}</p>
          </div>
        </div>
      </section>

      <section class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <UiCard class="overflow-hidden p-0">
          <div class="flex items-center gap-3 border-b border-[var(--border-soft)] px-5 py-4">
            <div class="grid size-8 place-items-center rounded-md bg-[var(--surface-high)] text-[var(--text-secondary)]">
              <Icon name="lucide:panel-top" class="size-4" />
            </div>
            <div>
              <h2 class="text-sm font-semibold text-[var(--text-primary)]">首页区块</h2>
              <p class="mt-0.5 text-xs text-[var(--text-secondary)]">标题内容</p>
            </div>
          </div>
          <div class="grid gap-4 p-5 md:grid-cols-2">
            <UiLabel class="space-y-2">
              <span class="text-xs font-medium text-[var(--text-secondary)]">区块标题</span>
              <UiInput
                v-model="features.galleryTitle"
                :disabled="saving"
                placeholder="例如：图册"
                class="rounded-md border-[var(--border-soft)] bg-[var(--surface-low)]"
                @change="saveGallerySettings"
              />
            </UiLabel>
            <UiLabel class="space-y-2">
              <span class="text-xs font-medium text-[var(--text-secondary)]">区块副标题</span>
              <UiInput
                v-model="features.gallerySubtitle"
                :disabled="saving"
                placeholder="显示在标题下方"
                class="rounded-md border-[var(--border-soft)] bg-[var(--surface-low)]"
                @change="saveGallerySettings"
              />
            </UiLabel>
          </div>
        </UiCard>

        <UiCard class="overflow-hidden p-0">
          <div class="flex items-center gap-3 border-b border-[var(--border-soft)] px-5 py-4">
            <div class="grid size-8 place-items-center rounded-md bg-[var(--surface-high)] text-[var(--text-secondary)]">
              <Icon name="lucide:monitor" class="size-4" />
            </div>
            <h2 class="text-sm font-semibold text-[var(--text-primary)]">展示状态</h2>
          </div>
          <label class="flex min-h-24 cursor-pointer items-center justify-between gap-4 px-5 py-4">
            <span class="min-w-0">
              <span class="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                <span :class="['size-2 rounded-full', features.galleryEnabled ? 'bg-emerald-500' : 'bg-slate-400']" />
                {{ features.galleryEnabled ? '区块已启用' : '区块已隐藏' }}
              </span>
              <span class="mt-1 block text-xs text-[var(--text-secondary)]">
                {{ enabledGalleryItems.length }} 个显示，{{ hiddenGalleryItems }} 个隐藏
              </span>
            </span>
            <UiCheckbox
              :model-value="features.galleryEnabled"
              :disabled="saving"
              @update:model-value="updateGalleryEnabled"
            />
          </label>
        </UiCard>
      </section>

      <UiCard class="overflow-hidden p-0">
        <div class="flex items-center justify-between gap-4 border-b border-[var(--border-soft)] px-5 py-4">
          <div class="flex min-w-0 items-center gap-3">
            <div class="grid size-8 shrink-0 place-items-center rounded-md bg-[var(--surface-high)] text-[var(--text-secondary)]">
              <Icon name="lucide:table-2" class="size-4" />
            </div>
            <div class="min-w-0">
              <h2 class="text-sm font-semibold text-[var(--text-primary)]">图册列表</h2>
              <p class="mt-0.5 text-xs text-[var(--text-secondary)]">共 {{ features.galleryItems.length }} 个图册</p>
            </div>
          </div>
          <UiButton size="sm" class="h-8 gap-1.5 px-2.5 text-xs" :disabled="saving" @click="openCreateDialog">
            <Icon name="lucide:plus" class="size-3.5" />
            新建图册
          </UiButton>
        </div>

        <div v-if="!features.galleryItems.length" class="grid min-h-72 place-items-center px-6 text-center">
          <div>
            <div class="mx-auto grid size-11 place-items-center rounded-md bg-[var(--surface-high)] text-[var(--text-secondary)]">
              <Icon name="lucide:images" class="size-5" />
            </div>
            <p class="mt-4 text-sm font-semibold text-[var(--text-primary)]">暂无图册</p>
            <UiButton size="sm" class="mt-4" :disabled="saving" @click="openCreateDialog">
              <Icon name="lucide:plus" class="size-4" />
              新建图册
            </UiButton>
          </div>
        </div>

        <div v-else>
          <div class="overflow-x-auto">
            <UiTable class="min-w-[960px]">
              <UiTableHeader>
                <UiTableRow class="bg-[var(--surface-low)] hover:bg-[var(--surface-low)]">
                  <UiTableHead class="w-[7rem] px-5">封面</UiTableHead>
                  <UiTableHead>图册信息</UiTableHead>
                  <UiTableHead class="w-[9rem]">分类</UiTableHead>
                  <UiTableHead class="w-[7rem]">图片数</UiTableHead>
                  <UiTableHead class="w-[6rem]">排序</UiTableHead>
                  <UiTableHead class="w-[7rem]">状态</UiTableHead>
                  <UiTableHead class="w-[6rem] px-5 text-right">操作</UiTableHead>
                </UiTableRow>
              </UiTableHeader>

              <UiTableBody>
                <UiTableRow v-for="item in paginatedGalleryItems" :key="item.id">
                  <UiTableCell class="px-5 py-3">
                    <div class="size-14 overflow-hidden rounded-md border border-[var(--border-soft)] bg-[var(--surface-low)]">
                      <img
                        :src="item.image || '/cover.jpg'"
                        :alt="item.title"
                        :class="['h-full w-full object-cover', !item.enabled && 'grayscale-[0.65] opacity-70']"
                        loading="lazy"
                      >
                    </div>
                  </UiTableCell>

                  <UiTableCell class="py-3">
                    <p class="max-w-[28rem] truncate text-sm font-semibold text-[var(--text-primary)]">
                      {{ item.title || '未命名图册' }}
                    </p>
                    <p class="mt-1 max-w-[34rem] truncate text-xs text-[var(--text-secondary)]" :title="item.description || item.image">
                      {{ item.description || item.image }}
                    </p>
                  </UiTableCell>

                  <UiTableCell>
                    <UiBadge variant="secondary" class="normal-case tracking-[0]">
                      {{ item.category || 'GALLERY' }}
                    </UiBadge>
                  </UiTableCell>

                  <UiTableCell class="text-sm tabular-nums text-[var(--text-secondary)]">
                    {{ item.images.length }}
                  </UiTableCell>

                  <UiTableCell>
                    <span class="inline-grid size-7 place-items-center rounded-md border border-[var(--border-soft)] text-xs font-semibold tabular-nums text-[var(--text-secondary)]">
                      {{ item.order }}
                    </span>
                  </UiTableCell>

                  <UiTableCell>
                    <UiBadge
                      variant="outline"
                      :class="[
                        'normal-case tracking-[0]',
                        item.enabled
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300'
                          : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-400/20 dark:bg-slate-400/10 dark:text-slate-300',
                      ]"
                    >
                      <span class="mr-1 size-1.5 rounded-full bg-current" />
                      {{ item.enabled ? '显示' : '隐藏' }}
                    </UiBadge>
                  </UiTableCell>

                  <UiTableCell class="px-5">
                    <div class="flex items-center justify-end gap-1">
                      <UiButton
                        variant="ghost"
                        size="icon"
                        class="size-8"
                        :disabled="saving"
                        aria-label="编辑图册"
                        title="编辑图册"
                        @click="openEditDialog(item)"
                      >
                        <Icon name="lucide:pencil" class="size-4" />
                      </UiButton>
                      <UiButton
                        variant="ghost"
                        size="icon"
                        class="size-8 text-red-600 hover:text-red-500 dark:text-red-400"
                        :disabled="saving"
                        aria-label="删除图册"
                        title="删除图册"
                        @click="removeGalleryItem(item.id)"
                      >
                        <Icon name="lucide:trash-2" class="size-4" />
                      </UiButton>
                    </div>
                  </UiTableCell>
                </UiTableRow>
              </UiTableBody>
            </UiTable>
          </div>

          <div class="flex flex-col gap-3 border-t border-[var(--border-soft)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p class="text-xs tabular-nums text-[var(--text-secondary)]">
              显示 {{ pageStart }} - {{ pageEnd }} / {{ sortedGalleryItems.length }}
            </p>
            <UiPagination
              v-if="sortedGalleryItems.length > PAGE_SIZE"
              :page="currentPage"
              :items-per-page="PAGE_SIZE"
              :total="sortedGalleryItems.length"
              :sibling-count="1"
              show-edges
              @update:page="goToPage"
            >
              <UiPaginationPrev>
                <Icon name="lucide:chevron-left" class="size-4" />
                上一页
              </UiPaginationPrev>
              <UiPaginationList v-slot="{ items }">
                <template v-for="(item, index) in items" :key="item.type === 'page' ? item.value : `ellipsis-${index}`">
                  <UiPaginationListItem v-if="item.type === 'page'" :value="item.value">
                    {{ item.value }}
                  </UiPaginationListItem>
                  <UiPaginationEllipsis v-else />
                </template>
              </UiPaginationList>
              <UiPaginationNext>
                下一页
                <Icon name="lucide:chevron-right" class="size-4" />
              </UiPaginationNext>
            </UiPagination>
          </div>
        </div>
      </UiCard>
    </template>

    <DialogRoot v-model:open="dialogOpen">
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 z-[120] bg-slate-950/45 backdrop-blur-sm" />
        <DialogContent class="fixed left-1/2 top-1/2 z-[121] flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--surface-card)] shadow-2xl outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">
          <form class="flex min-h-0 flex-1 flex-col" @submit.prevent="submitGallery">
            <div class="flex shrink-0 items-center justify-between border-b border-[var(--border-soft)] px-5 py-4 sm:px-6">
              <div class="flex items-center gap-3">
                <div class="flex size-9 items-center justify-center rounded-md bg-[var(--primary-soft)] text-[var(--primary)]">
                  <Icon :name="isEditing ? 'lucide:pencil' : 'lucide:images'" class="size-5" />
                </div>
                <div>
                  <DialogTitle class="text-base font-semibold text-[var(--text-primary)]">
                    {{ isEditing ? '编辑图册' : '新建图册' }}
                  </DialogTitle>
                  <DialogDescription class="mt-0.5 text-xs text-[var(--text-secondary)]">
                    {{ currentGallery.title || '未命名图册' }}
                  </DialogDescription>
                </div>
              </div>
              <DialogClose as-child>
                <UiButton type="button" variant="ghost" size="icon" class="size-8" aria-label="关闭弹窗" title="关闭" :disabled="saving">
                  <Icon name="lucide:x" class="size-4" />
                </UiButton>
              </DialogClose>
            </div>

            <div class="min-h-0 flex-1 overflow-y-auto">
              <div class="grid lg:grid-cols-[17rem_minmax(0,1fr)]">
                <aside class="border-b border-[var(--border-soft)] bg-[var(--surface-low)] p-5 lg:border-b-0 lg:border-r sm:p-6">
                  <div class="aspect-[4/3] overflow-hidden rounded-md border border-[var(--border-soft)] bg-[var(--surface-high)]">
                    <img :src="currentGallery.image || '/cover.jpg'" :alt="currentGallery.title" class="h-full w-full object-cover">
                  </div>
                  <div class="mt-4 flex items-center justify-between gap-3">
                    <UiBadge variant="secondary" class="normal-case tracking-[0]">
                      {{ currentGallery.category || 'GALLERY' }}
                    </UiBadge>
                    <span class="text-xs tabular-nums text-[var(--text-secondary)]">
                      {{ currentGallery.imagesText.split('\n').filter(Boolean).length }} 张
                    </span>
                  </div>
                  <p class="mt-3 truncate text-sm font-semibold text-[var(--text-primary)]">
                    {{ currentGallery.title || '未命名图册' }}
                  </p>
                  <p class="mt-1 line-clamp-3 text-xs leading-5 text-[var(--text-secondary)]">
                    {{ currentGallery.description || '暂无描述' }}
                  </p>
                </aside>

                <div class="space-y-8 p-5 sm:p-6">
                  <!-- 基本信息 -->
                  <div class="space-y-5">
                    <h3 class="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                      <Icon name="lucide:info" class="size-4 text-[var(--primary)]" />
                      基本信息
                    </h3>
                    <div class="grid gap-4 sm:grid-cols-2">
                      <UiLabel class="space-y-2">
                        <span class="text-xs font-medium text-[var(--text-secondary)]">标题 <span class="text-red-500">*</span></span>
                        <UiInput v-model="currentGallery.title" :disabled="saving" required placeholder="例如：舞台光" class="rounded-md border-[var(--border-soft)] bg-[var(--surface-low)]" />
                      </UiLabel>
                      <UiLabel class="space-y-2">
                        <span class="text-xs font-medium text-[var(--text-secondary)]">分类</span>
                        <UiInput v-model="currentGallery.category" :disabled="saving" placeholder="例如：LIVE" class="rounded-md border-[var(--border-soft)] bg-[var(--surface-low)]" />
                      </UiLabel>
                    </div>

                    <UiLabel class="space-y-2">
                      <span class="text-xs font-medium text-[var(--text-secondary)]">封面图片</span>
                      <UiInput v-model="currentGallery.image" :disabled="saving" placeholder="/cover.jpg 或 https://..." class="rounded-md border-[var(--border-soft)] bg-[var(--surface-low)]" />
                    </UiLabel>

                    <UiLabel class="space-y-2">
                      <span class="text-xs font-medium text-[var(--text-secondary)]">描述</span>
                      <UiTextarea v-model="currentGallery.description" :disabled="saving" placeholder="卡片上的简短说明" class="min-h-20 resize-none rounded-md border-[var(--border-soft)] bg-[var(--surface-low)] leading-6" />
                    </UiLabel>
                  </div>

                  <hr class="border-t border-[var(--border-soft)]" >

                  <!-- 图册内容 -->
                  <div class="space-y-5">
                    <h3 class="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                      <Icon name="lucide:images" class="size-4 text-[var(--primary)]" />
                      图册内容
                    </h3>
                    <UiLabel class="space-y-2">
                      <span class="text-xs font-medium text-[var(--text-secondary)]">图片列表 <span class="font-normal text-[var(--text-muted)]">(每行一个图片地址)</span></span>
                      <UiTextarea v-model="currentGallery.imagesText" :disabled="saving" placeholder="https://..." class="min-h-32 resize-none rounded-md border-[var(--border-soft)] bg-[var(--surface-low)] font-mono text-xs leading-6" />
                    </UiLabel>

                    <UiLabel class="space-y-2">
                      <span class="text-xs font-medium text-[var(--text-secondary)]">展开正文 <span class="font-normal text-[var(--text-muted)]">(可选)</span></span>
                      <UiTextarea v-model="currentGallery.content" :disabled="saving" placeholder="点击图册卡片后展示的正文" class="min-h-28 resize-none rounded-md border-[var(--border-soft)] bg-[var(--surface-low)] leading-6" />
                    </UiLabel>
                  </div>

                  <hr class="border-t border-[var(--border-soft)]" >

                  <!-- 展示设置 -->
                  <div class="space-y-5">
                    <h3 class="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                      <Icon name="lucide:monitor" class="size-4 text-[var(--primary)]" />
                      展示设置
                    </h3>
                    <div class="grid gap-4 sm:grid-cols-[9rem_minmax(0,1fr)]">
                      <UiLabel class="space-y-2">
                        <span class="block text-xs font-medium text-[var(--text-secondary)]">排序</span>
                        <UiInput v-model.number="currentGallery.order" :disabled="saving" type="number" min="1" class="rounded-md border-[var(--border-soft)] bg-[var(--surface-low)]" />
                      </UiLabel>
                      <UiLabel class="space-y-2">
                        <span class="block text-xs font-medium text-[var(--text-secondary)]">显示状态</span>
                        <span class="flex h-10 cursor-pointer items-center gap-3 rounded-md border border-[var(--border-soft)] bg-[var(--surface-low)] px-3">
                          <UiCheckbox v-model="currentGallery.enabled" :disabled="saving" />
                          <span class="text-sm font-medium text-[var(--text-primary)]">前台显示</span>
                        </span>
                      </UiLabel>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex shrink-0 items-center justify-end gap-3 border-t border-[var(--border-soft)] px-5 py-4 sm:px-6">
              <DialogClose as-child>
                <UiButton type="button" variant="ghost" :disabled="saving">
                  取消
                </UiButton>
              </DialogClose>
              <UiButton type="submit" :disabled="saving">
                <Icon :name="saving ? 'lucide:loader-circle' : isEditing ? 'lucide:save' : 'lucide:plus'" :class="['mr-2 size-4', saving && 'animate-spin']" />
                {{ saving ? '保存中...' : isEditing ? '更新图册' : '添加图册' }}
              </UiButton>
            </div>
          </form>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </div>
</template>
