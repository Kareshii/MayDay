<script setup lang="ts">
import type { AdminSiteSettings } from '@/composables/useAdminSiteSettings'

definePageMeta({
  layout: 'admin',
})

useSeoMeta({
  title: '全局设置',
  description: '维护站点名称、Logo、首页文案和站点状态。',
})

const {
  data,
  pending,
  error,
  refresh,
  savingSection,
  saveSection,
} = await useAdminSiteSettings('site')

const site = reactive<AdminSiteSettings>({
  siteName: '',
  siteLogo: '',
  homeHeroImage: '',
  homeHeroTitleLine1: '',
  homeHeroTitleLine2: '',
  homeHeroSubtitle: '',
  icpNumber: '',
  copyright: '',
  adminPath: '/admin',
  siteEnabled: true,
  closedMessage: '',
  maintenanceStatusCode: 503,
})
const settingsHydrated = ref(false)
const settingsDirty = ref(false)

watch(data, (value) => {
  if (value?.site) {
    settingsHydrated.value = false
    Object.assign(site, value.site)
    void nextTick(() => {
      settingsDirty.value = false
      settingsHydrated.value = true
    })
  }
}, { immediate: true })

watch(site, () => {
  if (!settingsHydrated.value) {
    return
  }

  settingsDirty.value = true
}, { deep: 1 })

async function saveSiteSettings() {
  const snapshot = JSON.stringify(site)
  const saved = await saveSection('site', site)

  if (saved && JSON.stringify(site) === snapshot) {
    settingsDirty.value = false
  }
}

const saveStateLabel = computed(() => savingSection.value === 'site'
  ? '保存中'
  : settingsDirty.value ? '待保存' : '已保存')
const headerActions = computed(() => [
  {
    label: savingSection.value === 'site' ? '保存中...' : '保存设置',
    icon: 'lucide:save',
    disabled: pending.value || savingSection.value === 'site' || !settingsDirty.value,
    onClick: saveSiteSettings,
  },
])
</script>

<template>
  <div class="cms-page space-y-5">
    <AdminPageHeader title="全局设置" subtitle="品牌、首页与站点可用性" :actions="headerActions" />

    <AdminSiteSettingsNav />

    <UiAlert v-if="error" variant="destructive">
      <Icon name="lucide:circle-alert" />
      <UiAlertTitle>全局设置加载失败</UiAlertTitle>
      <UiAlertDescription>{{ error.message }}</UiAlertDescription>
      <UiAlertAction>
        <UiButton variant="outline" size="sm" @click="refresh">
          <Icon name="lucide:refresh-cw" class="size-4" />
          重试
        </UiButton>
      </UiAlertAction>
    </UiAlert>

    <div v-else-if="pending" class="max-w-xl space-y-4" aria-label="正在加载全局设置">
      <UiSkeleton class="h-24 w-full" />
      <UiSkeleton class="h-72 w-full" />
      <UiSkeleton class="h-72 w-full" />
    </div>

    <template v-else>
      <section class="grid overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--surface-card)] sm:grid-cols-3">
        <div class="flex min-h-24 items-center gap-3 border-b border-[var(--border-soft)] px-5 py-4 sm:border-b-0 sm:border-r">
          <span class="grid size-9 shrink-0 place-items-center rounded-md bg-[var(--surface-high)] text-[var(--text-secondary)]">
            <Icon :name="site.siteEnabled ? 'lucide:radio-tower' : 'lucide:construction'" class="size-4" />
          </span>
          <div class="min-w-0">
            <p class="text-xs font-medium text-[var(--text-secondary)]">站点状态</p>
            <UiBadge class="mt-2" :variant="site.siteEnabled ? 'success' : 'warning'">
              {{ site.siteEnabled ? '正常开放' : '维护中' }}
            </UiBadge>
          </div>
        </div>
        <div class="flex min-h-24 items-center gap-3 border-b border-[var(--border-soft)] px-5 py-4 sm:border-b-0 sm:border-r">
          <span class="grid size-9 shrink-0 place-items-center rounded-md bg-[var(--surface-high)] text-[var(--text-secondary)]">
            <Icon name="lucide:type" class="size-4" />
          </span>
          <div class="min-w-0">
            <p class="text-xs font-medium text-[var(--text-secondary)]">网站名称</p>
            <p class="mt-1 truncate text-sm font-semibold text-[var(--text-primary)]">
              {{ site.siteName || '未设置' }}
            </p>
          </div>
        </div>
        <div class="flex min-h-24 items-center gap-3 px-5 py-4">
          <span class="grid size-9 shrink-0 place-items-center rounded-md bg-[var(--surface-high)] text-[var(--text-secondary)]">
            <Icon name="lucide:save" class="size-4" />
          </span>
          <div class="min-w-0">
            <p class="text-xs font-medium text-[var(--text-secondary)]">修改状态</p>
            <p class="mt-1 text-sm font-semibold text-[var(--text-primary)]">
              {{ saveStateLabel }}
            </p>
          </div>
        </div>
      </section>

      <form class="max-w-xl space-y-4" @submit.prevent="saveSiteSettings">
          <AdminSettingsPanel title="品牌标识" description="站点名称、Logo 与后台入口" icon="lucide:badge">
            <AdminSettingsRow label="网站名称">
              <UiInput v-model="site.siteName" aria-label="网站名称" placeholder="例如：我的独立博客" />
            </AdminSettingsRow>

            <AdminSettingsRow label="网站 Logo" description="支持站内路径或完整 URL" align="start">
              <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_5rem]">
                <UiInput v-model="site.siteLogo" aria-label="网站 Logo" placeholder="/logo.png" />
                <div class="grid aspect-square w-20 place-items-center overflow-hidden rounded-md border border-[var(--border-soft)] bg-[var(--surface-low)]">
                  <img v-if="site.siteLogo" :src="site.siteLogo" alt="网站 Logo 预览" class="size-full object-contain p-2">
                  <Icon v-else name="lucide:image" class="size-5 text-[var(--text-muted)]" />
                </div>
              </div>
            </AdminSettingsRow>

            <AdminSettingsRow label="后台路径" description="后台入口的 URL 路径">
              <UiInput v-model="site.adminPath" aria-label="后台路径" />
            </AdminSettingsRow>
          </AdminSettingsPanel>

          <AdminSettingsPanel title="首页首屏" description="封面与标题内容" icon="lucide:panel-top">
            <AdminSettingsRow label="首屏图片" description="建议使用横向大图" align="start">
              <div class="space-y-3">
                <UiInput v-model="site.homeHeroImage" aria-label="首屏图片" placeholder="/cover.jpg" />
                <div class="relative aspect-[16/5] overflow-hidden rounded-md border border-[var(--border-soft)] bg-[var(--surface-low)]">
                  <img v-if="site.homeHeroImage" :src="site.homeHeroImage" alt="首页首屏图片预览" class="size-full object-cover">
                  <div v-else class="grid size-full place-items-center text-[var(--text-muted)]">
                    <Icon name="lucide:panorama" class="size-6" />
                  </div>
                  <div v-if="site.homeHeroImage" class="absolute inset-x-0 bottom-0 bg-[var(--media-overlay)] px-3 py-2 text-xs text-[var(--media-overlay-foreground)]">
                    {{ site.homeHeroTitleLine1 || site.siteName || '首页首屏' }}
                  </div>
                </div>
              </div>
            </AdminSettingsRow>

            <AdminSettingsRow label="主标题">
              <div class="space-y-4">
                <UiLabel class="block space-y-2">
                  <span>第一行</span>
                  <UiInput v-model="site.homeHeroTitleLine1" placeholder="第一行" />
                </UiLabel>
                <UiLabel class="block space-y-2">
                  <span>第二行</span>
                  <UiInput v-model="site.homeHeroTitleLine2" placeholder="第二行" />
                </UiLabel>
              </div>
            </AdminSettingsRow>

            <AdminSettingsRow label="副标题" align="start">
              <UiTextarea v-model="site.homeHeroSubtitle" aria-label="副标题" rows="4" placeholder="首页副标题" />
            </AdminSettingsRow>
          </AdminSettingsPanel>

          <AdminSettingsPanel title="站点可用性" description="前台访问状态" icon="lucide:power">
            <AdminSettingsRow label="网站状态">
              <label class="flex cursor-pointer items-center justify-between gap-4 rounded-md border border-[var(--border-soft)] bg-[var(--surface-low)] px-3 py-3">
                <span class="flex min-w-0 items-center gap-3">
                  <Icon :name="site.siteEnabled ? 'lucide:circle-check' : 'lucide:construction'" class="size-4 text-[var(--text-secondary)]" />
                  <span class="text-sm font-medium text-[var(--text-primary)]">
                    {{ site.siteEnabled ? '正常开放' : '维护中' }}
                  </span>
                </span>
                <UiCheckbox v-model="site.siteEnabled" />
              </label>
            </AdminSettingsRow>

            <AdminSettingsRow label="维护提示" align="start">
              <UiTextarea
                v-model="site.closedMessage"
                placeholder="网站维护中..."
                :disabled="site.siteEnabled"
                aria-label="维护提示"
                rows="4"
              />
            </AdminSettingsRow>

            <AdminSettingsRow label="维护状态码" description="允许 400 至 599">
              <div class="max-w-32">
                <UiInput
                  v-model.number="site.maintenanceStatusCode"
                  aria-label="维护状态码"
                  type="number"
                  min="400"
                  max="599"
                  step="1"
                />
              </div>
            </AdminSettingsRow>
          </AdminSettingsPanel>

          <AdminSettingsPanel title="页脚信息" description="备案与版权" icon="lucide:panel-bottom">
            <AdminSettingsRow label="备案号码">
              <UiInput v-model="site.icpNumber" aria-label="备案号码" placeholder="例如：粤ICP备XXXX号" />
            </AdminSettingsRow>

            <AdminSettingsRow label="版权信息">
              <UiInput v-model="site.copyright" aria-label="版权信息" placeholder="Copyright © 2026" />
            </AdminSettingsRow>
          </AdminSettingsPanel>
      </form>
    </template>
  </div>
</template>
