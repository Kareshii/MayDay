<script setup lang="ts">
interface ContentImageItem {
  name: string
  url: string
  size: number
  updatedAt: string
  type: string
}

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
const { showSuccessToast, showErrorToast } = useAdminToast()

const { data, pending, error, refresh } = await useFetch<{ images: ContentImageItem[] }>('/api/admin/content-images')

const images = computed(() => data.value?.images || [])
const imageRows = computed(() => images.value.map(image => ({
  ...image,
  absoluteUrl: getAbsoluteImageUrl(image.url),
})))
const totalSize = computed(() => images.value.reduce((sum, image) => sum + image.size, 0))
const headerActions = computed(() => [
  {
    label: uploading.value ? '上传中...' : '上传图片',
    icon: 'lucide:upload',
    disabled: uploading.value,
    onClick: openPicker,
  },
])

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
  return new Date(value).toLocaleString()
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

watch(error, (value) => {
  if (value) {
    showErrorToast('图片列表加载失败', value.message)
  }
}, { immediate: true })
</script>

<template>
  <div class="cms-page space-y-3">
    <AdminPageHeader title="内容图片" subtitle="" :actions="headerActions" />

    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/png,image/webp,image/gif"
      class="hidden"
      @change="uploadImage"
    >

    <section class="grid gap-4 md:grid-cols-3">
      <UiCard class="p-5">
        <p class="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
          图片数量
        </p>
        <p class="mt-3 text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          {{ images.length }}
        </p>
      </UiCard>
      <UiCard class="p-5">
        <p class="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
          总占用
        </p>
        <p class="mt-3 text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          {{ formatSize(totalSize) }}
        </p>
      </UiCard>
      <UiCard class="p-5">
        <p class="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
          存放路径
        </p>
        <p class="mt-3 truncate text-sm font-semibold text-[var(--text-primary)]">
          R2 / content-images
        </p>
      </UiCard>
    </section>

    <div v-if="pending" class="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-card)] px-6 py-14 text-center text-sm text-[var(--text-secondary)]">
      正在加载图片...
    </div>

    <div v-else-if="!images.length" class="rounded-2xl border border-dashed border-[var(--border-soft)] bg-[var(--surface-card)] px-6 py-16 text-center">
      <Icon name="lucide:image-plus" class="mx-auto size-10 text-[var(--text-secondary)]" />
      <p class="mt-4 text-sm font-semibold text-[var(--text-primary)]">
        暂无图片
      </p>
      <p class="mt-2 text-sm text-[var(--text-secondary)]">
        上传后会出现在这里。
      </p>
    </div>

    <UiCard v-else class="overflow-hidden p-0">
      <UiTable class="min-w-[920px]">
        <UiTableHeader>
          <UiTableRow class="hover:bg-transparent">
            <UiTableHead class="w-[8rem] px-6">
              预览
            </UiTableHead>
            <UiTableHead>文件</UiTableHead>
            <UiTableHead class="w-[8rem]">
              类型
            </UiTableHead>
            <UiTableHead class="w-[8rem]">
              大小
            </UiTableHead>
            <UiTableHead class="w-[12rem]">
              更新时间
            </UiTableHead>
            <UiTableHead class="w-[12rem] px-6 text-right">
              操作
            </UiTableHead>
          </UiTableRow>
        </UiTableHeader>
        <UiTableBody>
          <UiTableRow
            v-for="image in imageRows"
            :key="image.name"
          >
            <UiTableCell class="px-6">
              <div class="size-16 overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--surface-low)]">
                <img
                  :src="image.url"
                  :alt="image.name"
                  class="h-full w-full object-cover"
                  loading="lazy"
                >
              </div>
            </UiTableCell>
            <UiTableCell>
              <p class="max-w-[24rem] truncate font-semibold text-[var(--text-primary)]">
                {{ image.name }}
              </p>
              <p class="mt-1 max-w-[30rem] truncate text-xs text-[var(--text-secondary)]">
                {{ image.url }}
              </p>
            </UiTableCell>
            <UiTableCell>
              <UiBadge variant="secondary">
                {{ image.type }}
              </UiBadge>
            </UiTableCell>
            <UiTableCell class="font-medium text-[var(--text-secondary)]">
              {{ formatSize(image.size) }}
            </UiTableCell>
            <UiTableCell class="text-[var(--text-secondary)]">
              {{ formatDate(image.updatedAt) }}
            </UiTableCell>
            <UiTableCell class="px-6">
              <div class="flex justify-end gap-2">
                <UiButton variant="secondary" size="sm" @click="copyUrl(image.url)">
                  <Icon :name="copiedUrl === image.absoluteUrl ? 'lucide:check' : 'lucide:copy'" class="size-4" />
                  {{ copiedUrl === image.absoluteUrl ? '已复制' : '复制地址' }}
                </UiButton>
                <UiButton
                  variant="ghost"
                  size="sm"
                  :disabled="deletingName === image.name"
                  @click="deleteImage(image)"
                >
                  <Icon name="lucide:trash-2" class="size-4" />
                  删除
                </UiButton>
              </div>
            </UiTableCell>
          </UiTableRow>
        </UiTableBody>
      </UiTable>
    </UiCard>
  </div>
</template>
