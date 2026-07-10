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

    <div v-if="pending" class="flex min-h-56 items-center justify-center rounded-lg border border-[var(--border-soft)] bg-[var(--surface-card)]">
      <div class="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
        <Icon name="lucide:loader-circle" class="size-4 animate-spin text-[var(--primary)]" />
        正在加载设置
      </div>
    </div>

    <template v-else>
      <section class="grid overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--surface-card)] sm:grid-cols-3">
        <div class="flex min-h-24 items-center gap-3 border-b border-[var(--border-soft)] px-5 py-4 sm:border-b-0 sm:border-r">
          <span
            class="grid size-9 shrink-0 place-items-center rounded-md"
            :class="site.siteEnabled ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300'"
          >
            <Icon :name="site.siteEnabled ? 'lucide:radio-tower' : 'lucide:construction'" class="size-4" />
          </span>
          <div class="min-w-0">
            <p class="text-xs font-medium text-[var(--text-secondary)]">站点状态</p>
            <p class="mt-1 truncate text-sm font-semibold text-[var(--text-primary)]">
              {{ site.siteEnabled ? '正常开放' : '维护中' }}
            </p>
          </div>
        </div>
        <div class="flex min-h-24 items-center gap-3 border-b border-[var(--border-soft)] px-5 py-4 sm:border-b-0 sm:border-r">
          <span class="grid size-9 shrink-0 place-items-center rounded-md bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300">
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
          <span class="grid size-9 shrink-0 place-items-center rounded-md bg-violet-50 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300">
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

      <div class="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
        <div class="space-y-4">
          <AdminSettingsPanel title="品牌标识" description="站点名称、Logo 与后台入口" icon="lucide:badge">
            <AdminSettingsRow label="网站名称">
              <UiInput v-model="site.siteName" placeholder="例如：我的独立博客" class="rounded-md border-[var(--border-soft)] bg-[var(--surface-low)]" />
            </AdminSettingsRow>

            <AdminSettingsRow label="网站 Logo" description="支持站内路径或完整 URL" align="start">
              <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_5rem]">
                <UiInput v-model="site.siteLogo" placeholder="/logo.png" class="rounded-md border-[var(--border-soft)] bg-[var(--surface-low)]" />
                <div class="grid aspect-square w-20 place-items-center overflow-hidden rounded-md border border-[var(--border-soft)] bg-[var(--surface-low)]">
                  <img v-if="site.siteLogo" :src="site.siteLogo" alt="网站 Logo 预览" class="size-full object-contain p-2">
                  <Icon v-else name="lucide:image" class="size-5 text-[var(--text-muted)]" />
                </div>
              </div>
            </AdminSettingsRow>

            <AdminSettingsRow label="后台路径" description="后台入口的 URL 路径">
              <div class="relative">
                <Icon name="lucide:route" class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--text-muted)]" />
                <UiInput v-model="site.adminPath" class="rounded-md border-[var(--border-soft)] bg-[var(--surface-low)] pl-9 font-mono" />
              </div>
            </AdminSettingsRow>
          </AdminSettingsPanel>

          <AdminSettingsPanel title="首页首屏" description="封面与标题内容" icon="lucide:panel-top">
            <AdminSettingsRow label="首屏图片" description="建议使用横向大图" align="start">
              <div class="space-y-3">
                <UiInput v-model="site.homeHeroImage" placeholder="/cover.jpg" class="rounded-md border-[var(--border-soft)] bg-[var(--surface-low)]" />
                <div class="relative aspect-[16/5] overflow-hidden rounded-md border border-[var(--border-soft)] bg-[var(--surface-low)]">
                  <img v-if="site.homeHeroImage" :src="site.homeHeroImage" alt="首页首屏图片预览" class="size-full object-cover">
                  <div v-else class="grid size-full place-items-center text-[var(--text-muted)]">
                    <Icon name="lucide:panorama" class="size-6" />
                  </div>
                  <div v-if="site.homeHeroImage" class="absolute inset-x-0 bottom-0 bg-slate-950/55 px-3 py-2 text-xs text-white">
                    {{ site.homeHeroTitleLine1 || site.siteName || '首页首屏' }}
                  </div>
                </div>
              </div>
            </AdminSettingsRow>

            <AdminSettingsRow label="主标题">
              <div class="grid gap-3 md:grid-cols-2">
                <UiInput v-model="site.homeHeroTitleLine1" placeholder="第一行" class="rounded-md border-[var(--border-soft)] bg-[var(--surface-low)]" />
                <UiInput v-model="site.homeHeroTitleLine2" placeholder="第二行" class="rounded-md border-[var(--border-soft)] bg-[var(--surface-low)]" />
              </div>
            </AdminSettingsRow>

            <AdminSettingsRow label="副标题" align="start">
              <UiTextarea v-model="site.homeHeroSubtitle" placeholder="首页副标题" class="min-h-24 rounded-md border-[var(--border-soft)] bg-[var(--surface-low)] leading-6" />
            </AdminSettingsRow>
          </AdminSettingsPanel>
        </div>

        <div class="space-y-4">
          <AdminSettingsPanel title="站点可用性" description="前台访问状态" icon="lucide:power">
            <AdminSettingsRow label="网站状态">
              <label class="flex cursor-pointer items-center justify-between gap-4 rounded-md border border-[var(--border-soft)] bg-[var(--surface-low)] px-3 py-3">
                <span class="flex min-w-0 items-center gap-3">
                  <span :class="['size-2 shrink-0 rounded-full', site.siteEnabled ? 'bg-emerald-500' : 'bg-amber-500']" />
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
                class="min-h-24 rounded-md border-[var(--border-soft)] bg-[var(--surface-low)] leading-6"
              />
            </AdminSettingsRow>

            <AdminSettingsRow label="维护状态码" description="允许 400 至 599">
              <UiInput
                v-model="site.maintenanceStatusCode"
                type="number"
                min="400"
                max="599"
                step="1"
                class="max-w-32 rounded-md border-[var(--border-soft)] bg-[var(--surface-low)] font-mono"
              />
            </AdminSettingsRow>
          </AdminSettingsPanel>

          <AdminSettingsPanel title="页脚信息" description="备案与版权" icon="lucide:panel-bottom">
            <AdminSettingsRow label="备案号码">
              <UiInput v-model="site.icpNumber" placeholder="例如：粤ICP备XXXX号" class="rounded-md border-[var(--border-soft)] bg-[var(--surface-low)]" />
            </AdminSettingsRow>

            <AdminSettingsRow label="版权信息">
              <UiInput v-model="site.copyright" placeholder="Copyright © 2026" class="rounded-md border-[var(--border-soft)] bg-[var(--surface-low)]" />
            </AdminSettingsRow>
          </AdminSettingsPanel>
        </div>
      </div>
    </template>
  </div>
</template>
