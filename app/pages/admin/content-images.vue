<script setup lang="ts">
import type { TableColumn } from '@/components/ui/table'

interface ContentImageItem {
  name: string
  url: string
  size: number
  updatedAt: string
  type: string
}

const PAGE_SIZE = 20
const imageColumns = [
  { prop: 'file', label: '文件', minWidth: 360, headerClass: 'px-5', cellClass: 'px-5 py-3' },
  { prop: 'type', label: '格式', width: 112, cellClass: 'py-3' },
  { prop: 'size', label: '大小', width: 112, align: 'right', cellClass: 'py-3 text-sm font-medium tabular-nums text-[var(--text-secondary)]', formatter: (_item, _column, value) => formatSize(Number(value)) },
  { prop: 'updatedAt', label: '更新时间', width: 192, cellClass: 'py-3 text-xs text-[var(--text-secondary)]', formatter: (_item, _column, value) => formatDate(String(value)) },
  { prop: 'actions', label: '操作', width: 152, align: 'right', headerClass: 'px-5', cellClass: 'px-5 py-3' },
] satisfies readonly TableColumn[]

definePageMeta({
  layout: 'admin',
})

useSeoMeta({
  title: '内容图片',
  description: '上传并管理文章内容中使用的图片。',
})

const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const deletingName = ref('')
const deleteDialogOpen = ref(false)
const deleteTarget = ref<ContentImageItem | null>(null)
const copiedUrl = ref('')
const searchInput = ref('')
const imageTypeFilter = ref('all')
const currentPage = ref(1)
const { showSuccessToast, showErrorToast } = useAdminToast()

const { data, pending, error, refresh } = await useFetch<{ images: ContentImageItem[] }>('/api/admin/content-images')

const images = computed(() => data.value?.images || [])
const imageRows = computed(() => images.value.map(image => ({
  ...image,
  absoluteUrl: getAbsoluteImageUrl(image.url),
})))
const imageTypeOptions = computed(() => [...new Set(images.value.map(image => image.type).filter(Boolean))].sort())
const filteredImageRows = computed(() => {
  const keyword = searchInput.value.trim().toLocaleLowerCase('zh-CN')
  const rows = imageTypeFilter.value === 'all'
    ? imageRows.value
    : imageRows.value.filter(image => image.type === imageTypeFilter.value)

  if (!keyword) {
    return rows
  }

  return rows.filter(image => [image.name, image.type, image.url]
    .join(' ')
    .toLocaleLowerCase('zh-CN')
    .includes(keyword))
})
const totalPages = computed(() => Math.max(1, Math.ceil(filteredImageRows.value.length / PAGE_SIZE)))
const paginatedImageRows = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredImageRows.value.slice(start, start + PAGE_SIZE)
})
const headerActions = computed(() => [
  {
    label: uploading.value ? '上传中...' : '上传图片',
    icon: 'lucide:upload',
    disabled: uploading.value,
    onClick: openPicker,
  },
])

watch([searchInput, imageTypeFilter], () => {
  currentPage.value = 1
})

watch(imageTypeOptions, (options) => {
  if (imageTypeFilter.value !== 'all' && !options.includes(imageTypeFilter.value)) {
    imageTypeFilter.value = 'all'
  }
})

watch(totalPages, (value) => {
  currentPage.value = Math.min(currentPage.value, value)
})

function formatSize(size: number) {
  if (size < 1024) {
    return `${size} B`
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

function formatDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Shanghai',
  }).format(date)
}

function getAbsoluteImageUrl(url: string) {
  if (/^https?:\/\//.test(url)) {
    return url
  }

  const origin = import.meta.client ? window.location.origin : ''
  return origin ? new URL(url, origin).toString() : url
}

function openPicker() {
  fileInput.value?.click()
}

async function uploadImage(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) {
    return
  }

  uploading.value = true

  try {
    const form = new FormData()
    form.append('file', file)
    await $fetch('/api/admin/content-images', {
      method: 'POST',
      body: form,
    })
    await refresh()
    currentPage.value = 1
    showSuccessToast('图片上传成功', file.name)
  } catch (err) {
    showErrorToast('上传失败', getRequestErrorMessage(err, '上传失败'))
  } finally {
    uploading.value = false
    input.value = ''
  }
}

async function copyUrl(url: string) {
  const copiedText = getAbsoluteImageUrl(url)

  try {
    await writeClipboardText(copiedText)
  } catch {
    showErrorToast('复制失败', '请手动复制图片地址。')
    return
  }

  copiedUrl.value = copiedText
  showSuccessToast('图片地址已复制', copiedText)

  window.setTimeout(() => {
    if (copiedUrl.value === copiedText) {
      copiedUrl.value = ''
    }
  }, 1600)
}

async function writeClipboardText(text: string) {
  if (window.isSecureContext && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.readOnly = true
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  textarea.style.top = '0'

  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()
  textarea.setSelectionRange(0, text.length)

  const copied = document.execCommand('copy')
  document.body.removeChild(textarea)

  if (!copied) {
    throw new Error('Copy failed')
  }
}

function requestDeleteImage(image: ContentImageItem) {
  deleteTarget.value = image
  deleteDialogOpen.value = true
}

function handleDeleteDialogOpenChange(open: boolean) {
  if (!open && deletingName.value) {
    return
  }

  deleteDialogOpen.value = open

  if (!open) {
    deleteTarget.value = null
  }
}

async function deleteImage(image: ContentImageItem) {
  deletingName.value = image.name

  try {
    await $fetch(`/api/admin/content-images/${encodeURIComponent(image.name)}`, {
      method: 'DELETE',
    })
    await refresh()
    showSuccessToast('图片已删除', image.name)
    deleteDialogOpen.value = false
    deleteTarget.value = null
  } catch (err) {
    showErrorToast('删除失败', getRequestErrorMessage(err, '删除失败'))
  } finally {
    deletingName.value = ''
  }
}

function goToPage(nextPage: number) {
  currentPage.value = Math.min(Math.max(1, nextPage), totalPages.value)
}

watch(error, (value) => {
  if (value) {
    showErrorToast('图片列表加载失败', value.message)
  }
}, { immediate: true })
</script>

<template>
  <div class="cms-page space-y-4">
    <AdminPageHeader
      title="内容图片"
      subtitle="文章图片资源与存储占用"
      :actions="headerActions"
    />

    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/png,image/webp,image/gif"
      class="hidden"
      @change="uploadImage"
    >

    <UiCard class="overflow-hidden">
      <div class="flex flex-col items-stretch gap-3 border-b border-[var(--border-soft)] p-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-5 lg:p-5">
        <div class="flex shrink-0 items-center gap-2">
          <UiLabel for="content-image-search" class="shrink-0 text-sm font-medium text-[var(--text-secondary)]">
            搜索
          </UiLabel>
          <div class="w-[min(20rem,70vw)]">
            <UiInput
              id="content-image-search"
              v-model="searchInput"
              type="search"
              placeholder="搜索文件名、格式或地址"
              class="max-w-none"
            />
          </div>
        </div>

        <div class="flex shrink-0 items-center gap-2">
          <UiLabel for="content-image-type-filter" class="shrink-0 text-sm font-medium text-[var(--text-secondary)]">
            格式
          </UiLabel>
          <UiSelect v-model="imageTypeFilter">
            <UiSelectTrigger id="content-image-type-filter" class="w-[min(120px,60vw)]">
              <UiSelectValue placeholder="全部格式" />
            </UiSelectTrigger>
            <UiSelectContent>
              <UiSelectItem value="all">全部格式</UiSelectItem>
              <UiSelectItem v-for="type in imageTypeOptions" :key="type" :value="type">
                {{ type }}
              </UiSelectItem>
            </UiSelectContent>
          </UiSelect>
        </div>

        <div class="flex h-9 shrink-0 items-center text-xs text-[var(--text-secondary)]">
          共 <strong class="mx-1 font-semibold tabular-nums text-[var(--text-primary)]">{{ filteredImageRows.length }}</strong> 张
        </div>
      </div>

      <UiTable
        class="min-w-[860px]"
        :columns="imageColumns"
        :items="paginatedImageRows"
        row-key="name"
        :loading="pending"
        loading-text="正在加载图片"
        :error="error?.message || ''"
        :empty-text="images.length ? '没有匹配的图片，请调整搜索或格式筛选' : '暂无图片'"
        pagination
        :page="currentPage"
        :items-per-page="PAGE_SIZE"
        :total="filteredImageRows.length"
        @retry="refresh"
        @update:page="goToPage"
      >
          <template #cell-file="{ item: image }">
            <div class="grid grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-3">
              <a
                :href="image.absoluteUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="block aspect-square overflow-hidden rounded-md border border-[var(--border-soft)] bg-[var(--surface-low)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
              >
                <img :src="image.url" :alt="image.name" class="size-full object-cover" loading="lazy">
              </a>
              <div class="min-w-0">
                <p class="truncate text-sm font-semibold text-[var(--text-primary)]" :title="image.name">{{ image.name }}</p>
                <p class="mt-1 truncate font-mono text-[10px] text-[var(--text-muted)]" :title="image.url">{{ image.url }}</p>
              </div>
            </div>
          </template>

          <template #cell-type="{ item: image }">
            <UiBadge variant="outline" class="normal-case tracking-[0]">{{ image.type }}</UiBadge>
          </template>

          <template #cell-actions="{ item: image }">
            <div class="flex justify-end gap-1">
              <UiTooltip>
                <UiTooltipTrigger as-child>
                  <UiButton
                    variant="ghost"
                    size="icon-sm"
                    :aria-label="copiedUrl === image.absoluteUrl ? '已复制' : '复制地址'"
                    @click="copyUrl(image.url)"
                  >
                    <Icon :name="copiedUrl === image.absoluteUrl ? 'lucide:check' : 'lucide:copy'" class="size-4" />
                  </UiButton>
                </UiTooltipTrigger>
                <UiTooltipContent>{{ copiedUrl === image.absoluteUrl ? '已复制' : '复制地址' }}</UiTooltipContent>
              </UiTooltip>

              <UiTooltip>
                <UiTooltipTrigger as-child>
                  <UiButton
                    as="a"
                    :href="image.absoluteUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="打开图片"
                  >
                    <Icon name="lucide:external-link" class="size-4" />
                  </UiButton>
                </UiTooltipTrigger>
                <UiTooltipContent>打开图片</UiTooltipContent>
              </UiTooltip>

              <UiDropdownMenu>
                <UiTooltip>
                  <UiTooltipTrigger as-child>
                    <UiDropdownMenuTrigger as-child>
                      <UiButton variant="ghost" size="icon-sm" aria-label="更多图片操作">
                        <Icon name="lucide:ellipsis" class="size-4" />
                      </UiButton>
                    </UiDropdownMenuTrigger>
                  </UiTooltipTrigger>
                  <UiTooltipContent>更多操作</UiTooltipContent>
                </UiTooltip>
                <UiDropdownMenuContent align="end">
                  <UiDropdownMenuSeparator />
                  <UiDropdownMenuItem variant="destructive" @select="requestDeleteImage(image)">
                    <Icon name="lucide:trash-2" />
                    删除图片
                  </UiDropdownMenuItem>
                </UiDropdownMenuContent>
              </UiDropdownMenu>
            </div>
          </template>
      </UiTable>
    </UiCard>

    <UiAlertDialog :open="deleteDialogOpen" @update:open="handleDeleteDialogOpenChange">
      <UiAlertDialogContent>
        <UiAlertDialogHeader>
          <UiAlertDialogTitle>删除图片？</UiAlertDialogTitle>
          <UiAlertDialogDescription>
            将永久删除“{{ deleteTarget?.name }}”，引用该地址的文章可能无法继续显示图片。
          </UiAlertDialogDescription>
        </UiAlertDialogHeader>
        <UiAlertDialogFooter>
          <UiAlertDialogCancel :disabled="Boolean(deletingName)">取消</UiAlertDialogCancel>
          <UiAlertDialogAction
            variant="destructive"
            class="min-w-24"
            :disabled="!deleteTarget || Boolean(deletingName)"
            @click.prevent="deleteTarget && deleteImage(deleteTarget)"
          >
            <Icon v-if="deletingName" name="lucide:loader-circle" class="size-4 animate-spin" />
            {{ deletingName ? '删除中...' : '删除图片' }}
          </UiAlertDialogAction>
        </UiAlertDialogFooter>
      </UiAlertDialogContent>
    </UiAlertDialog>
  </div>
</template>
