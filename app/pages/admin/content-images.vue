<script setup lang="ts">
interface ContentImageItem {
  name: string
  url: string
  size: number
  updatedAt: string
  type: string
}

const PAGE_SIZE = 20

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
const copiedUrl = ref('')
const searchInput = ref('')
const currentPage = ref(1)
const { showSuccessToast, showErrorToast } = useAdminToast()

const { data, pending, error, refresh } = await useFetch<{ images: ContentImageItem[] }>('/api/admin/content-images')

const images = computed(() => data.value?.images || [])
const imageRows = computed(() => images.value.map(image => ({
  ...image,
  absoluteUrl: getAbsoluteImageUrl(image.url),
})))
const filteredImageRows = computed(() => {
  const keyword = searchInput.value.trim().toLocaleLowerCase('zh-CN')

  if (!keyword) {
    return imageRows.value
  }

  return imageRows.value.filter(image => [image.name, image.type, image.url]
    .join(' ')
    .toLocaleLowerCase('zh-CN')
    .includes(keyword))
})
const totalPages = computed(() => Math.max(1, Math.ceil(filteredImageRows.value.length / PAGE_SIZE)))
const paginatedImageRows = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredImageRows.value.slice(start, start + PAGE_SIZE)
})
const pageStart = computed(() => filteredImageRows.value.length
  ? (currentPage.value - 1) * PAGE_SIZE + 1
  : 0)
const pageEnd = computed(() => Math.min(currentPage.value * PAGE_SIZE, filteredImageRows.value.length))
const totalSize = computed(() => images.value.reduce((sum, image) => sum + image.size, 0))
const imageTypeCount = computed(() => new Set(images.value.map(image => image.type)).size)
const headerActions = computed(() => [
  {
    label: uploading.value ? '上传中...' : '上传图片',
    icon: 'lucide:upload',
    disabled: uploading.value,
    onClick: openPicker,
  },
])
const headerSearch = computed(() => ({
  value: searchInput.value,
  placeholder: '搜索文件名或格式...',
  label: '搜索内容图片',
  onUpdate: (value: string) => {
    searchInput.value = value
  },
}))

watch(searchInput, () => {
  currentPage.value = 1
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

async function deleteImage(image: ContentImageItem) {
  if (!window.confirm(`删除 ${image.name}？`)) {
    return
  }

  deletingName.value = image.name

  try {
    await $fetch(`/api/admin/content-images/${encodeURIComponent(image.name)}`, {
      method: 'DELETE',
    })
    await refresh()
    showSuccessToast('图片已删除', image.name)
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
      :search="headerSearch"
    />

    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/png,image/webp,image/gif"
      class="hidden"
      @change="uploadImage"
    >

    <section class="grid overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--surface-card)] sm:grid-cols-3">
      <div class="flex min-h-24 items-center gap-3 border-b border-[var(--border-soft)] px-5 py-4 sm:border-b-0 sm:border-r">
        <span class="grid size-9 shrink-0 place-items-center rounded-md bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300">
          <Icon name="lucide:images" class="size-4" />
        </span>
        <div>
          <p class="text-xs font-medium text-[var(--text-secondary)]">图片数量</p>
          <p class="mt-1 text-xl font-bold tabular-nums text-[var(--text-primary)]">{{ images.length }}</p>
        </div>
      </div>
      <div class="flex min-h-24 items-center gap-3 border-b border-[var(--border-soft)] px-5 py-4 sm:border-b-0 sm:border-r">
        <span class="grid size-9 shrink-0 place-items-center rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
          <Icon name="lucide:hard-drive" class="size-4" />
        </span>
        <div>
          <p class="text-xs font-medium text-[var(--text-secondary)]">总占用</p>
          <p class="mt-1 text-xl font-bold tabular-nums text-[var(--text-primary)]">{{ formatSize(totalSize) }}</p>
        </div>
      </div>
      <div class="flex min-h-24 items-center gap-3 px-5 py-4">
        <span class="grid size-9 shrink-0 place-items-center rounded-md bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
          <Icon name="lucide:file-image" class="size-4" />
        </span>
        <div>
          <p class="text-xs font-medium text-[var(--text-secondary)]">文件格式</p>
          <p class="mt-1 text-xl font-bold tabular-nums text-[var(--text-primary)]">{{ imageTypeCount }}</p>
        </div>
      </div>
    </section>

    <section class="overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--surface-card)]">
      <header class="flex min-h-16 items-center justify-between gap-4 border-b border-[var(--border-soft)] px-5 py-3.5">
        <div class="flex min-w-0 items-center gap-3">
          <span class="grid size-8 shrink-0 place-items-center rounded-md bg-[var(--surface-high)] text-[var(--text-secondary)]">
            <Icon name="lucide:table-2" class="size-4" />
          </span>
          <div class="min-w-0">
            <h2 class="text-sm font-semibold text-[var(--text-primary)]">图片列表</h2>
            <p class="mt-0.5 truncate text-xs text-[var(--text-secondary)]">
              R2 / content-images
            </p>
          </div>
        </div>
        <p class="shrink-0 text-xs text-[var(--text-secondary)]">
          {{ filteredImageRows.length }} 个结果
        </p>
      </header>

      <div v-if="pending" class="flex min-h-64 items-center justify-center">
        <div class="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
          <Icon name="lucide:loader-circle" class="size-4 animate-spin text-[var(--primary)]" />
          正在加载图片
        </div>
      </div>

      <div v-else-if="!filteredImageRows.length" class="px-5 py-16 text-center">
        <span class="mx-auto grid size-12 place-items-center rounded-md bg-[var(--surface-high)] text-[var(--text-muted)]">
          <Icon :name="images.length ? 'lucide:file-search' : 'lucide:image-plus'" class="size-5" />
        </span>
        <p class="mt-4 text-sm font-semibold text-[var(--text-primary)]">
          {{ images.length ? '没有匹配的图片' : '暂无图片' }}
        </p>
        <p v-if="images.length" class="mt-1 text-xs text-[var(--text-secondary)]">调整搜索关键词</p>
      </div>

      <template v-else>
        <UiTable class="min-w-[860px]">
          <UiTableHeader>
            <UiTableRow class="hover:bg-transparent">
              <UiTableHead class="px-5">文件</UiTableHead>
              <UiTableHead class="w-[7rem]">格式</UiTableHead>
              <UiTableHead class="w-[7rem] text-right">大小</UiTableHead>
              <UiTableHead class="w-[12rem]">更新时间</UiTableHead>
              <UiTableHead class="w-[9rem] px-5 text-right">操作</UiTableHead>
            </UiTableRow>
          </UiTableHeader>
          <UiTableBody>
            <UiTableRow v-for="image in paginatedImageRows" :key="image.name">
              <UiTableCell class="px-5 py-3">
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
                    <p class="truncate text-sm font-semibold text-[var(--text-primary)]">{{ image.name }}</p>
                    <p class="mt-1 truncate font-mono text-[10px] text-[var(--text-muted)]">{{ image.url }}</p>
                  </div>
                </div>
              </UiTableCell>

              <UiTableCell class="py-3">
                <UiBadge variant="outline" class="normal-case tracking-[0]">{{ image.type }}</UiBadge>
              </UiTableCell>

              <UiTableCell class="py-3 text-right text-sm font-medium tabular-nums text-[var(--text-secondary)]">
                {{ formatSize(image.size) }}
              </UiTableCell>

              <UiTableCell class="py-3 text-xs text-[var(--text-secondary)]">
                {{ formatDate(image.updatedAt) }}
              </UiTableCell>

              <UiTableCell class="px-5 py-3">
                <div class="flex justify-end gap-1">
                  <UiButton
                    variant="ghost"
                    size="icon"
                    class="size-8 text-[var(--text-secondary)]"
                    :title="copiedUrl === image.absoluteUrl ? '已复制' : '复制地址'"
                    :aria-label="copiedUrl === image.absoluteUrl ? '已复制' : '复制地址'"
                    @click="copyUrl(image.url)"
                  >
                    <Icon :name="copiedUrl === image.absoluteUrl ? 'lucide:check' : 'lucide:copy'" class="size-4" />
                  </UiButton>
                  <UiButton
                    as="a"
                    :href="image.absoluteUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="ghost"
                    size="icon"
                    class="size-8 text-[var(--text-secondary)]"
                    title="打开图片"
                    aria-label="打开图片"
                  >
                    <Icon name="lucide:external-link" class="size-4" />
                  </UiButton>
                  <UiButton
                    variant="ghost"
                    size="icon"
                    class="size-8 text-[var(--text-muted)] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                    :disabled="deletingName === image.name"
                    title="删除图片"
                    aria-label="删除图片"
                    @click="deleteImage(image)"
                  >
                    <Icon :name="deletingName === image.name ? 'lucide:loader-circle' : 'lucide:trash-2'" :class="['size-4', deletingName === image.name ? 'animate-spin' : '']" />
                  </UiButton>
                </div>
              </UiTableCell>
            </UiTableRow>
          </UiTableBody>
        </UiTable>

        <div class="flex flex-col gap-3 border-t border-[var(--border-soft)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p class="text-xs text-[var(--text-secondary)]">
            显示 <span class="font-medium tabular-nums text-[var(--text-primary)]">{{ pageStart }} - {{ pageEnd }}</span> / {{ filteredImageRows.length }}
          </p>
          <UiPagination
            v-if="totalPages > 1"
            :page="currentPage"
            :items-per-page="PAGE_SIZE"
            :total="filteredImageRows.length"
            :sibling-count="1"
            show-edges
            @update:page="goToPage"
          >
            <UiPaginationPrev>
              <Icon name="lucide:chevron-left" class="size-4" />
              上一页
            </UiPaginationPrev>
            <UiPaginationList v-slot="{ items }">
              <template
                v-for="(item, index) in items"
                :key="item.type === 'page' ? item.value : `ellipsis-${index}`"
              >
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
      </template>
    </section>
  </div>
</template>
