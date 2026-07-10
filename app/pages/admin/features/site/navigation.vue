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
} = await useAdminSiteSettings('navigation')

const NAVIGATION_ROOT_VALUE = '__root__'
const navigation = ref<AdminNavigationItem[]>([])
const settingsHydrated = ref(false)
const settingsDirty = ref(false)

watch(data, (value) => {
  settingsHydrated.value = false
  navigation.value = value?.navigation?.map(item => ({ ...item })) || []
  void nextTick(() => {
    settingsDirty.value = false
    settingsHydrated.value = true
  })
}, { immediate: true })

watch(navigation, () => {
  if (!settingsHydrated.value) {
    return
  }

  settingsDirty.value = true
}, { deep: 2 })

async function saveNavigationSettings() {
  const snapshot = JSON.stringify(navigation.value)
  const saved = await saveSection('navigation', navigation.value)

  if (saved && JSON.stringify(navigation.value) === snapshot) {
    settingsDirty.value = false
  }
}

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
  navigation.value = navigation.value
    .filter(item => item.id !== id)
    .map(item => item.parentId === id ? { ...item, parentId: '' } : item)
}

function collectNavigationDescendantIds(itemId: string) {
  const result = new Set<string>()
  const walk = (parentId: string) => {
    navigation.value
      .filter(item => item.parentId === parentId)
      .forEach((item) => {
        if (result.has(item.id)) {
          return
        }

        result.add(item.id)
        walk(item.id)
      })
  }

  walk(itemId)
  return result
}

function getParentOptions(itemId: string) {
  const excludedIds = collectNavigationDescendantIds(itemId)
  excludedIds.add(itemId)
  return navigation.value.filter(item => !excludedIds.has(item.id))
}

function getParentValue(item: AdminNavigationItem) {
  return item.parentId || NAVIGATION_ROOT_VALUE
}

function updateParent(item: AdminNavigationItem, value: string) {
  item.parentId = value === NAVIGATION_ROOT_VALUE ? '' : value
}

const enabledNavigationCount = computed(() => navigation.value.filter(item => item.enabled).length)
const externalNavigationCount = computed(() => navigation.value.filter(item => item.type === 'external').length)
const saveStateLabel = computed(() => savingSection.value === 'navigation'
  ? '保存中'
  : settingsDirty.value ? '待保存' : '已保存')
const headerActions = computed(() => [
  {
    label: '新增导航',
    icon: 'lucide:plus',
    variant: 'secondary' as const,
    disabled: pending.value,
    onClick: addNavigation,
  },
  {
    label: savingSection.value === 'navigation' ? '保存中...' : '保存导航',
    icon: 'lucide:save',
    disabled: pending.value || savingSection.value === 'navigation' || !settingsDirty.value,
    onClick: saveNavigationSettings,
  },
])
</script>

<template>
  <div class="cms-page space-y-5">
    <AdminPageHeader title="导航设置" subtitle="前台菜单结构与链接" :actions="headerActions" />

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
            <Icon name="lucide:list-tree" class="size-4" />
          </span>
          <div>
            <p class="text-xs font-medium text-[var(--text-secondary)]">导航总数</p>
            <p class="mt-1 text-xl font-bold tabular-nums text-[var(--text-primary)]">{{ navigation.length }}</p>
          </div>
        </div>
        <div class="flex min-h-24 items-center gap-3 border-b border-[var(--border-soft)] px-5 py-4 sm:border-b-0 sm:border-r">
          <span class="grid size-9 shrink-0 place-items-center rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
            <Icon name="lucide:eye" class="size-4" />
          </span>
          <div>
            <p class="text-xs font-medium text-[var(--text-secondary)]">前台显示</p>
            <p class="mt-1 text-xl font-bold tabular-nums text-[var(--text-primary)]">{{ enabledNavigationCount }}</p>
          </div>
        </div>
        <div class="flex min-h-24 items-center gap-3 px-5 py-4">
          <span class="grid size-9 shrink-0 place-items-center rounded-md bg-violet-50 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300">
            <Icon name="lucide:external-link" class="size-4" />
          </span>
          <div>
            <p class="text-xs font-medium text-[var(--text-secondary)]">站外链接</p>
            <p class="mt-1 text-xl font-bold tabular-nums text-[var(--text-primary)]">{{ externalNavigationCount }}</p>
          </div>
        </div>
      </section>

      <section class="overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--surface-card)]">
        <header class="flex min-h-16 items-center justify-between gap-4 border-b border-[var(--border-soft)] px-5 py-3.5">
          <div class="flex min-w-0 items-center gap-3">
            <span class="grid size-8 shrink-0 place-items-center rounded-md bg-[var(--surface-high)] text-[var(--text-secondary)]">
              <Icon name="lucide:menu" class="size-4" />
            </span>
            <div class="min-w-0">
              <h2 class="text-sm font-semibold text-[var(--text-primary)]">菜单项目</h2>
              <p class="mt-0.5 text-xs text-[var(--text-secondary)]">{{ navigation.length }} 项</p>
            </div>
          </div>
          <span class="inline-flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)]">
            <span
              :class="[
                'size-1.5 rounded-full',
                savingSection === 'navigation'
                  ? 'animate-pulse bg-amber-500'
                  : settingsDirty ? 'bg-amber-500' : 'bg-emerald-500',
              ]"
            />
            {{ saveStateLabel }}
          </span>
        </header>

        <div v-if="!navigation.length" class="px-5 py-16 text-center">
          <span class="mx-auto grid size-11 place-items-center rounded-md bg-[var(--surface-high)] text-[var(--text-muted)]">
            <Icon name="lucide:menu" class="size-5" />
          </span>
          <p class="mt-4 text-sm font-semibold text-[var(--text-primary)]">暂无导航</p>
        </div>

        <template v-else>
          <div class="hidden grid-cols-[minmax(9rem,1fr)_minmax(12rem,1.4fr)_8rem_10rem_5rem_2.5rem] gap-3 border-b border-[var(--border-soft)] bg-[var(--surface-low)] px-5 py-2.5 text-xs font-medium text-[var(--text-secondary)] lg:grid">
            <span>标题</span>
            <span>链接</span>
            <span>类型</span>
            <span>上级</span>
            <span class="text-center">显示</span>
            <span />
          </div>

          <div class="divide-y divide-[var(--border-soft)]">
          <div
            v-for="item in navigation"
            :key="item.id"
            class="group grid gap-3 px-5 py-4 transition-colors hover:bg-[var(--surface-low)] lg:grid-cols-[minmax(9rem,1fr)_minmax(12rem,1.4fr)_8rem_10rem_5rem_2.5rem] lg:items-center"
          >
            <UiLabel class="space-y-1.5 lg:space-y-0">
              <span class="text-xs font-medium text-[var(--text-secondary)] lg:hidden">标题</span>
              <UiInput v-model="item.title" class="h-9 rounded-md border-[var(--border-soft)] bg-[var(--surface-low)] font-medium" placeholder="导航标题" />
            </UiLabel>

            <UiLabel class="space-y-1.5 lg:space-y-0">
              <span class="text-xs font-medium text-[var(--text-secondary)] lg:hidden">链接</span>
              <div class="relative">
                <Icon :name="item.type === 'external' ? 'lucide:external-link' : 'lucide:route'" class="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
                <UiInput v-model="item.path" class="h-9 rounded-md border-[var(--border-soft)] bg-[var(--surface-low)] pl-8 font-mono text-xs" placeholder="/posts" />
              </div>
            </UiLabel>

            <UiLabel class="space-y-1.5 lg:space-y-0">
              <span class="text-xs font-medium text-[var(--text-secondary)] lg:hidden">类型</span>
              <UiSelect v-model="item.type">
                <UiSelectTrigger class="h-9 rounded-md border-[var(--border-soft)] bg-[var(--surface-low)] px-2">
                  <UiSelectValue placeholder="链接类型" />
                </UiSelectTrigger>
                <UiSelectContent>
                  <UiSelectItem value="internal">站内</UiSelectItem>
                  <UiSelectItem value="external">站外</UiSelectItem>
                </UiSelectContent>
              </UiSelect>
            </UiLabel>

            <UiLabel class="space-y-1.5 lg:space-y-0">
              <span class="text-xs font-medium text-[var(--text-secondary)] lg:hidden">上级</span>
              <UiSelect :model-value="getParentValue(item)" @update:model-value="updateParent(item, $event)">
                <UiSelectTrigger class="h-9 rounded-md border-[var(--border-soft)] bg-[var(--surface-low)] px-2">
                  <UiSelectValue placeholder="顶级导航" />
                </UiSelectTrigger>
                <UiSelectContent>
                  <UiSelectItem :value="NAVIGATION_ROOT_VALUE">顶级导航</UiSelectItem>
                  <UiSelectItem v-for="parent in getParentOptions(item.id)" :key="parent.id" :value="parent.id">
                    {{ parent.title || '未命名导航' }}
                  </UiSelectItem>
                </UiSelectContent>
              </UiSelect>
            </UiLabel>

            <div class="flex items-center justify-between gap-3 lg:justify-center">
              <span class="text-xs font-medium text-[var(--text-secondary)] lg:hidden">前台显示</span>
              <UiCheckbox v-model="item.enabled" :aria-label="`${item.title || '导航'}前台显示`" />
            </div>

            <div class="flex justify-end">
              <UiButton variant="ghost" size="icon" class="size-9 text-[var(--text-muted)] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30" title="删除导航" aria-label="删除导航" @click="removeNavigation(item.id)">
                <Icon name="lucide:trash-2" class="size-4" />
              </UiButton>
            </div>

            <UiLabel class="flex items-center gap-2 lg:col-span-6">
              <span class="shrink-0 text-xs font-medium text-[var(--text-secondary)]">排序</span>
              <UiInput v-model.number="item.order" type="number" class="h-8 w-24 rounded-md border-[var(--border-soft)] bg-[var(--surface-low)] text-center text-xs tabular-nums" />
            </UiLabel>
          </div>
        </div>
        </template>
      </section>
    </template>
  </div>
</template>
