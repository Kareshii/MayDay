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
  homeHeroTitleLine1: '',
  homeHeroTitleLine2: '',
  homeHeroSubtitle: '',
  icpNumber: '',
  copyright: '',
  adminPath: '/admin',
  siteEnabled: true,
  closedMessage: '',
})

watch(data, (value) => {
  if (value?.site) {
    Object.assign(site, value.site)
  }
}, { immediate: true })
</script>

<template>
  <div class="cms-page space-y-4">
    <AdminPageHeader title="全局设置" subtitle="" />

    <div v-if="pending" class="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-card)] px-6 py-14 text-center text-sm text-[var(--text-secondary)]">
      正在加载设置...
    </div>

    <UiCard v-else class="overflow-hidden p-0">
      <div class="flex items-center justify-between border-b border-[var(--border-soft)] bg-[var(--surface-low)] px-6 py-4">
        <div>
          <h3 class="text-base font-bold text-[var(--text-primary)]">
            全局设置
          </h3>
          <p class="mt-0.5 text-xs text-[var(--text-secondary)]">
            控制站点名称、Logo、首页文案、备案、版权和闭站提示。
          </p>
        </div>
        <UiButton size="sm" :disabled="savingSection === 'site'" @click="saveSection('site', site)">
          保存设置
        </UiButton>
      </div>

      <div class="divide-y divide-[var(--border-soft)] px-6">
        <div class="flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
          <div class="md:w-1/3">
            <h4 class="text-sm font-medium text-[var(--text-primary)]">网站名称</h4>
          </div>
          <div class="md:w-1/2">
            <UiInput v-model="site.siteName" placeholder="例如：我的独立博客" />
          </div>
        </div>

        <div class="flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
          <div class="md:w-1/3">
            <h4 class="text-sm font-medium text-[var(--text-primary)]">网站 Logo URL</h4>
          </div>
          <div class="md:w-1/2">
            <UiInput v-model="site.siteLogo" placeholder="https://..." />
          </div>
        </div>

        <div class="flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
          <div class="md:w-1/3">
            <h4 class="text-sm font-medium text-[var(--text-primary)]">首页主标题第一行</h4>
          </div>
          <div class="md:w-1/2">
            <UiInput v-model="site.homeHeroTitleLine1" placeholder="Hi，Kareshi" />
          </div>
        </div>

        <div class="flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
          <div class="md:w-1/3">
            <h4 class="text-sm font-medium text-[var(--text-primary)]">首页主标题第二行</h4>
          </div>
          <div class="md:w-1/2">
            <UiInput v-model="site.homeHeroTitleLine2" placeholder="继续唱。" />
          </div>
        </div>

        <div class="flex flex-col gap-4 py-5 md:flex-row md:items-start md:justify-between">
          <div class="md:w-1/3">
            <h4 class="text-sm font-medium text-[var(--text-primary)]">首页副标题</h4>
          </div>
          <div class="md:w-1/2">
            <UiTextarea v-model="site.homeHeroSubtitle" placeholder="星星在闪烁，你会怎么说。" class="min-h-20" />
          </div>
        </div>

        <div class="flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
          <div class="md:w-1/3">
            <h4 class="text-sm font-medium text-[var(--text-primary)]">后台地址路径</h4>
            <p class="mt-1 text-xs text-[var(--text-secondary)]">默认 `/admin`。</p>
          </div>
          <div class="md:w-1/2">
            <UiInput v-model="site.adminPath" />
          </div>
        </div>

        <div class="flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
          <div class="md:w-1/3">
            <h4 class="text-sm font-medium text-[var(--text-primary)]">备案号码</h4>
          </div>
          <div class="md:w-1/2">
            <UiInput v-model="site.icpNumber" placeholder="例如：粤ICP备XXXX号" />
          </div>
        </div>

        <div class="flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
          <div class="md:w-1/3">
            <h4 class="text-sm font-medium text-[var(--text-primary)]">版权信息</h4>
          </div>
          <div class="md:w-1/2">
            <UiInput v-model="site.copyright" placeholder="Copyright © 2024" />
          </div>
        </div>

        <div class="flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
          <div class="md:w-1/3">
            <h4 class="text-sm font-medium text-[var(--text-primary)]">网站状态</h4>
          </div>
          <div class="flex items-center md:w-1/2">
            <label class="flex cursor-pointer items-center gap-2">
              <UiCheckbox v-model="site.siteEnabled" />
              <span class="text-sm text-[var(--text-primary)]">{{ site.siteEnabled ? '已开启' : '已关闭' }}</span>
            </label>
          </div>
        </div>

        <div class="flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
          <div class="md:w-1/3">
            <h4 class="text-sm font-medium text-[var(--text-primary)]">闭站提示</h4>
          </div>
          <div class="md:w-1/2">
            <UiInput v-model="site.closedMessage" placeholder="网站维护中..." :disabled="site.siteEnabled" />
          </div>
        </div>
      </div>
    </UiCard>
  </div>
</template>
