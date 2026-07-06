<script setup lang="ts">
import type { AdminNavigationItem } from '@/composables/useAdminSiteSettings'
import { createAdminLocalId } from '@/composables/useAdminSiteSettings'

definePageMeta({
  layout: 'admin',
})

useSeoMeta({
  title: '导航设置',
  description: '维护前台顶部导航菜单。',
})

const {
  data,
  pending,
  savingSection,
  saveSection,
} = await useAdminSiteSettings()

const navigation = ref<AdminNavigationItem[]>([])

watch(data, (value) => {
  navigation.value = value?.navigation.map(item => ({ ...item })) || []
}, { immediate: true })

function addNavigation() {
  navigation.value.push({
    id: createAdminLocalId('navigation'),
    title: '新导航',
    path: '/',
    type: 'internal',
    parentId: '',
    order: navigation.value.length + 1,
    enabled: true,
  })
}

function removeNavigation(id: string) {
  navigation.value = navigation.value.filter(item => item.id !== id)
}
</script>

<template>
  <div class="cms-page space-y-4">
    <AdminPageHeader title="导航设置" subtitle="" />

    <div v-if="pending" class="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-card)] px-6 py-14 text-center text-sm text-[var(--text-secondary)]">
      正在加载设置...
    </div>

    <UiCard v-else class="overflow-hidden p-0">
      <div class="flex items-center justify-between border-b border-[var(--border-soft)] bg-[var(--surface-low)] px-6 py-4">
        <div>
          <h3 class="text-base font-bold text-[var(--text-primary)]">
            导航设置
          </h3>
          <p class="mt-0.5 text-xs text-[var(--text-secondary)]">
            管理前台顶部导航菜单。
          </p>
        </div>
        <div class="flex gap-2">
          <UiButton variant="secondary" size="sm" @click="addNavigation">
            <Icon name="lucide:plus" class="mr-1 size-4" /> 新增
          </UiButton>
          <UiButton size="sm" :disabled="savingSection === 'navigation'" @click="saveSection('navigation', navigation)">
            保存导航
          </UiButton>
        </div>
      </div>

      <div class="px-6 py-2">
        <div v-if="!navigation.length" class="py-8 text-center text-sm text-[var(--text-secondary)]">
          暂无导航数据。
        </div>

        <div class="divide-y divide-[var(--border-soft)]">
          <div
            v-for="item in navigation"
            :key="item.id"
            class="group flex flex-col gap-3 py-4 transition-colors hover:bg-[var(--surface-hover)]/30 md:flex-row md:items-center"
          >
            <div class="grid flex-1 items-center gap-3 md:grid-cols-[1fr_1.4fr_8rem_5rem_auto]">
              <UiInput v-model="item.title" variant="ghost" class="font-medium text-[var(--text-primary)]" placeholder="导航标题" />
              <UiInput v-model="item.path" variant="ghost" class="text-[var(--text-secondary)]" placeholder="/posts 或 https://..." />

              <select v-model="item.type" class="h-9 w-full rounded-lg border border-transparent bg-transparent px-2 text-sm text-[var(--text-primary)] outline-none transition hover:bg-[var(--surface-hover)] focus:border-[var(--primary)] focus:bg-[var(--surface-card)] focus:ring-2 focus:ring-[var(--focus-ring)]">
                <option value="internal">站内链接</option>
                <option value="external">站外链接</option>
              </select>

              <UiInput v-model.number="item.order" variant="ghost" type="number" placeholder="排序" class="text-center" />

              <div class="flex items-center justify-end gap-3 px-2">
                <label class="flex cursor-pointer items-center gap-2">
                  <UiCheckbox v-model="item.enabled" />
                  <span class="text-xs text-[var(--text-secondary)]">显示</span>
                </label>
                <UiButton variant="ghost" size="icon" class="text-red-500 opacity-0 group-hover:opacity-100 focus-within:opacity-100 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30" @click="removeNavigation(item.id)">
                  <Icon name="lucide:trash-2" class="size-4" />
                </UiButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UiCard>
  </div>
</template>
