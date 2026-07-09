<script setup lang="ts">
import type { AdminContentSettings } from '@/composables/useAdminSiteSettings'

definePageMeta({
  layout: 'admin',
})

useSeoMeta({
  title: '内容设置',
  description: '维护图片处理、外链和缩略图策略。',
})

const {
  data,
  pending,
  savingSection,
  saveSection,
} = await useAdminSiteSettings('content')

const content = reactive<AdminContentSettings>({
  autoFetchRemoteImages: false,
  filterExternalLinks: false,
  compressImages: false,
  imageMaxWidth: 1600,
  imageMaxHeight: 1600,
  thumbnailWidth: 250,
  thumbnailHeight: 250,
  thumbnailMode: 'cover',
  defaultThumbnail: '',
})

watch(data, (value) => {
  if (value?.content) {
    Object.assign(content, value.content)
  }
}, { immediate: true })
</script>

<template>
  <div class="cms-page space-y-4">
    <AdminPageHeader title="内容设置" subtitle="" />

    <div v-if="pending" class="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-card)] px-6 py-14 text-center text-sm text-[var(--text-secondary)]">
      正在加载设置...
    </div>

    <UiCard v-else class="overflow-hidden p-0">
      <div class="flex items-center justify-between border-b border-[var(--border-soft)] bg-[var(--surface-low)] px-6 py-4">
        <div>
          <h3 class="text-base font-bold text-[var(--text-primary)]">
            内容设置
          </h3>
          <p class="mt-0.5 text-xs text-[var(--text-secondary)]">
            图片处理、外部链接和缩略图策略。
          </p>
        </div>
        <UiButton size="sm" :disabled="savingSection === 'content'" @click="saveSection('content', content)">
          保存内容设置
        </UiButton>
      </div>

      <div class="divide-y divide-[var(--border-soft)] px-6">
        <div class="flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
          <div class="md:w-1/3">
            <h4 class="text-sm font-medium text-[var(--text-primary)]">远程图片策略</h4>
          </div>
          <div class="flex items-center gap-6 md:w-1/2">
            <UiLabel class="flex cursor-pointer items-center gap-2">
              <UiCheckbox v-model="content.autoFetchRemoteImages" />
              <span class="text-sm text-[var(--text-primary)]">自动抓取本地化</span>
            </UiLabel>
            <UiLabel class="flex cursor-pointer items-center gap-2">
              <UiCheckbox v-model="content.compressImages" />
              <span class="text-sm text-[var(--text-primary)]">开启压缩</span>
            </UiLabel>
          </div>
        </div>

        <div class="flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
          <div class="md:w-1/3">
            <h4 class="text-sm font-medium text-[var(--text-primary)]">外链策略</h4>
          </div>
          <div class="flex items-center gap-6 md:w-1/2">
            <UiLabel class="flex cursor-pointer items-center gap-2">
              <UiCheckbox v-model="content.filterExternalLinks" />
              <span class="text-sm text-[var(--text-primary)]">自动添加 nofollow</span>
            </UiLabel>
          </div>
        </div>

        <div class="flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
          <div class="md:w-1/3">
            <h4 class="text-sm font-medium text-[var(--text-primary)]">大图限制</h4>
          </div>
          <div class="flex items-center gap-2 md:w-1/2">
            <UiInput v-model.number="content.imageMaxWidth" type="number" placeholder="宽度" class="w-24 text-center" />
            <span class="text-[var(--text-muted)]">×</span>
            <UiInput v-model.number="content.imageMaxHeight" type="number" placeholder="高度" class="w-24 text-center" />
            <span class="text-xs text-[var(--text-secondary)]">px</span>
          </div>
        </div>

        <div class="flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
          <div class="md:w-1/3">
            <h4 class="text-sm font-medium text-[var(--text-primary)]">缩略图生成</h4>
          </div>
          <div class="flex items-center gap-2 md:w-1/2">
            <UiInput v-model.number="content.thumbnailWidth" type="number" placeholder="宽" class="w-20 text-center" />
            <span class="text-[var(--text-muted)]">×</span>
            <UiInput v-model.number="content.thumbnailHeight" type="number" placeholder="高" class="w-20 text-center" />
            <span class="text-xs text-[var(--text-secondary)]">px</span>

            <UiSelect v-model="content.thumbnailMode">
              <UiSelectTrigger class="ml-2 w-44 border-[var(--border-soft)]">
                <UiSelectValue placeholder="缩略图模式" />
              </UiSelectTrigger>
              <UiSelectContent>
                <UiSelectItem value="cover">中心裁剪 (Cover)</UiSelectItem>
                <UiSelectItem value="contain">等比缩放 (Contain)</UiSelectItem>
                <UiSelectItem value="longest">最长边缩放</UiSelectItem>
              </UiSelectContent>
            </UiSelect>
          </div>
        </div>

        <div class="flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
          <div class="md:w-1/3">
            <h4 class="text-sm font-medium text-[var(--text-primary)]">默认缩略图</h4>
            <p class="mt-1 text-xs text-[var(--text-secondary)]">文章未设置封面时的默认图片。</p>
          </div>
          <div class="md:w-1/2">
            <UiInput v-model="content.defaultThumbnail" placeholder="https://..." />
          </div>
        </div>
      </div>
    </UiCard>
  </div>
</template>
