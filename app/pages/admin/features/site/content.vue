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
const settingsHydrated = ref(false)
const settingsDirty = ref(false)

watch(data, (value) => {
  if (value?.content) {
    settingsHydrated.value = false
    Object.assign(content, value.content)
    void nextTick(() => {
      settingsDirty.value = false
      settingsHydrated.value = true
    })
  }
}, { immediate: true })

watch(content, () => {
  if (!settingsHydrated.value) {
    return
  }

  settingsDirty.value = true
}, { deep: 1 })

async function saveContentSettings() {
  const snapshot = JSON.stringify(content)
  const saved = await saveSection('content', content)

  if (saved && JSON.stringify(content) === snapshot) {
    settingsDirty.value = false
  }
}

const saveStateLabel = computed(() => savingSection.value === 'content'
  ? '保存中'
  : settingsDirty.value ? '待保存' : '已保存')
const enabledPolicyCount = computed(() => [
  content.autoFetchRemoteImages,
  content.compressImages,
  content.filterExternalLinks,
].filter(Boolean).length)
const headerActions = computed(() => [
  {
    label: savingSection.value === 'content' ? '保存中...' : '保存内容设置',
    icon: 'lucide:save',
    disabled: pending.value || savingSection.value === 'content' || !settingsDirty.value,
    onClick: saveContentSettings,
  },
])
</script>

<template>
  <div class="cms-page space-y-5">
    <AdminPageHeader title="内容设置" subtitle="图片处理与外链策略" :actions="headerActions" />

    <AdminSiteSettingsNav />

    <div v-if="pending" class="flex min-h-56 items-center justify-center rounded-lg border border-[var(--border-soft)] bg-[var(--surface-card)]">
      <div class="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
        <Icon name="lucide:loader-circle" class="size-4 animate-spin text-[var(--primary)]" />
        正在加载设置
      </div>
    </div>

    <template v-else>
      <section class="grid overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--surface-card)] sm:grid-cols-3">
        <div class="flex min-h-24 items-center gap-3 border-b border-[var(--border-soft)] px-5 py-4 sm:border-b-0 sm:border-r">
          <span class="grid size-9 shrink-0 place-items-center rounded-md bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300">
            <Icon name="lucide:wand-sparkles" class="size-4" />
          </span>
          <div>
            <p class="text-xs font-medium text-[var(--text-secondary)]">启用策略</p>
            <p class="mt-1 text-sm font-semibold text-[var(--text-primary)]">{{ enabledPolicyCount }} / 3</p>
          </div>
        </div>
        <div class="flex min-h-24 items-center gap-3 border-b border-[var(--border-soft)] px-5 py-4 sm:border-b-0 sm:border-r">
          <span class="grid size-9 shrink-0 place-items-center rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
            <Icon name="lucide:maximize-2" class="size-4" />
          </span>
          <div>
            <p class="text-xs font-medium text-[var(--text-secondary)]">大图上限</p>
            <p class="mt-1 text-sm font-semibold tabular-nums text-[var(--text-primary)]">
              {{ content.imageMaxWidth }} × {{ content.imageMaxHeight }}
            </p>
          </div>
        </div>
        <div class="flex min-h-24 items-center gap-3 px-5 py-4">
          <span class="grid size-9 shrink-0 place-items-center rounded-md bg-violet-50 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300">
            <Icon name="lucide:save" class="size-4" />
          </span>
          <div>
            <p class="text-xs font-medium text-[var(--text-secondary)]">修改状态</p>
            <p class="mt-1 text-sm font-semibold text-[var(--text-primary)]">{{ saveStateLabel }}</p>
          </div>
        </div>
      </section>

      <div class="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
        <div class="space-y-4">
          <AdminSettingsPanel title="处理策略" description="入库与输出规则" icon="lucide:workflow">
            <AdminSettingsRow label="远程图片本地化" description="保存内容时抓取远程图片">
              <label class="flex cursor-pointer items-center justify-between gap-4 rounded-md border border-[var(--border-soft)] bg-[var(--surface-low)] px-3 py-3">
                <span class="flex items-center gap-3 text-sm font-medium text-[var(--text-primary)]">
                  <Icon name="lucide:cloud-download" class="size-4 text-[var(--text-secondary)]" />
                  {{ content.autoFetchRemoteImages ? '已启用' : '已关闭' }}
                </span>
                <UiCheckbox v-model="content.autoFetchRemoteImages" />
              </label>
            </AdminSettingsRow>

            <AdminSettingsRow label="图片压缩" description="写入前压缩图片体积">
              <label class="flex cursor-pointer items-center justify-between gap-4 rounded-md border border-[var(--border-soft)] bg-[var(--surface-low)] px-3 py-3">
                <span class="flex items-center gap-3 text-sm font-medium text-[var(--text-primary)]">
                  <Icon name="lucide:minimize-2" class="size-4 text-[var(--text-secondary)]" />
                  {{ content.compressImages ? '已启用' : '已关闭' }}
                </span>
                <UiCheckbox v-model="content.compressImages" />
              </label>
            </AdminSettingsRow>

            <AdminSettingsRow label="外链 nofollow" description="为外部链接增加 nofollow">
              <label class="flex cursor-pointer items-center justify-between gap-4 rounded-md border border-[var(--border-soft)] bg-[var(--surface-low)] px-3 py-3">
                <span class="flex items-center gap-3 text-sm font-medium text-[var(--text-primary)]">
                  <Icon name="lucide:external-link" class="size-4 text-[var(--text-secondary)]" />
                  {{ content.filterExternalLinks ? '已启用' : '已关闭' }}
                </span>
                <UiCheckbox v-model="content.filterExternalLinks" />
              </label>
            </AdminSettingsRow>
          </AdminSettingsPanel>

          <AdminSettingsPanel title="尺寸规则" description="原图与缩略图输出尺寸" icon="lucide:ruler">
            <AdminSettingsRow label="大图上限" description="宽度 × 高度，单位 px">
              <div class="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                <UiInput v-model.number="content.imageMaxWidth" type="number" min="1" placeholder="宽度" class="rounded-md border-[var(--border-soft)] bg-[var(--surface-low)] text-center tabular-nums" />
                <span class="text-[var(--text-muted)]">×</span>
                <UiInput v-model.number="content.imageMaxHeight" type="number" min="1" placeholder="高度" class="rounded-md border-[var(--border-soft)] bg-[var(--surface-low)] text-center tabular-nums" />
              </div>
            </AdminSettingsRow>

            <AdminSettingsRow label="缩略图尺寸" description="宽度 × 高度，单位 px">
              <div class="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                <UiInput v-model.number="content.thumbnailWidth" type="number" min="1" placeholder="宽度" class="rounded-md border-[var(--border-soft)] bg-[var(--surface-low)] text-center tabular-nums" />
                <span class="text-[var(--text-muted)]">×</span>
                <UiInput v-model.number="content.thumbnailHeight" type="number" min="1" placeholder="高度" class="rounded-md border-[var(--border-soft)] bg-[var(--surface-low)] text-center tabular-nums" />
              </div>
            </AdminSettingsRow>

            <AdminSettingsRow label="生成模式">
              <UiSelect v-model="content.thumbnailMode">
                <UiSelectTrigger class="rounded-md border-[var(--border-soft)] bg-[var(--surface-low)]">
                  <UiSelectValue placeholder="缩略图模式" />
                </UiSelectTrigger>
                <UiSelectContent>
                  <UiSelectItem value="cover">中心裁剪</UiSelectItem>
                  <UiSelectItem value="contain">等比缩放</UiSelectItem>
                  <UiSelectItem value="longest">最长边缩放</UiSelectItem>
                </UiSelectContent>
              </UiSelect>
            </AdminSettingsRow>
          </AdminSettingsPanel>
        </div>

        <AdminSettingsPanel title="默认缩略图" description="文章未设置封面时使用" icon="lucide:image">
          <div class="px-5 py-5">
            <div class="aspect-[4/3] overflow-hidden rounded-md border border-[var(--border-soft)] bg-[var(--surface-low)]">
              <img v-if="content.defaultThumbnail" :src="content.defaultThumbnail" alt="默认缩略图预览" class="size-full object-cover">
              <div v-else class="grid size-full place-items-center text-[var(--text-muted)]">
                <Icon name="lucide:image-off" class="size-7" />
              </div>
            </div>
            <UiInput v-model="content.defaultThumbnail" placeholder="/cover.jpg" class="mt-4 rounded-md border-[var(--border-soft)] bg-[var(--surface-low)]" />
            <div class="mt-4 flex items-center justify-between border-t border-[var(--border-soft)] pt-4 text-xs text-[var(--text-secondary)]">
              <span>输出尺寸</span>
              <span class="font-mono tabular-nums text-[var(--text-primary)]">
                {{ content.thumbnailWidth }} × {{ content.thumbnailHeight }}
              </span>
            </div>
          </div>
        </AdminSettingsPanel>
      </div>
    </template>
  </div>
</template>
