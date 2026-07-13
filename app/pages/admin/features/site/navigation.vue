<script setup lang="ts">
import type { TableColumn } from '@/components/ui/table'
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
  error,
  refresh,
  savingSection,
  saveSection,
} = await useAdminSiteSettings('navigation')

const PAGE_SIZE = 20
const NAVIGATION_ROOT_VALUE = '__root__'
const navigationColumns = [
  { prop: 'title', label: '标题', minWidth: 180 },
  { prop: 'path', label: '链接', minWidth: 240 },
  { prop: 'type', label: '类型', width: 104 },
  { prop: 'parent', label: '上级', minWidth: 160 },
  { prop: 'order', label: '排序', width: 88 },
  { prop: 'enabled', label: '状态', width: 120 },
  { prop: 'actions', label: '操作', width: 104, align: 'right' },
] satisfies readonly TableColumn[]
const navigation = ref<AdminNavigationItem[]>([])
const currentPage = ref(1)
const dialogOpen = ref(false)
const editingNavigationId = ref('')
const navigationDraft = ref<AdminNavigationItem | null>(null)
const navigationToDelete = ref<AdminNavigationItem | null>(null)
const settingsHydrated = ref(false)
const settingsDirty = ref(false)
const {
  discardDialogOpen,
  captureDraft,
  requestClose: requestDialogClose,
  handleOpenChange: handleDialogOpenChange,
  discardDraft,
} = useDialogDraftGuard(navigationDraft, closeDialogNow)

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

function createNavigationDraft(): AdminNavigationItem {
  return {
    id: createAdminLocalId('navigation'),
    title: '',
    path: '',
    type: 'internal',
    parentId: '',
    order: navigation.value.length + 1,
    enabled: true,
  }
}

function openCreateDialog() {
  editingNavigationId.value = ''
  navigationDraft.value = createNavigationDraft()
  captureDraft()
  dialogOpen.value = true
}

function openEditDialog(item: AdminNavigationItem) {
  editingNavigationId.value = item.id
  navigationDraft.value = { ...item }
  captureDraft()
  dialogOpen.value = true
}

function closeDialogNow() {
  dialogOpen.value = false
  editingNavigationId.value = ''
  navigationDraft.value = null
}

function submitNavigation() {
  const draft = navigationDraft.value

  if (!draft) {
    return
  }

  const nextItem = {
    ...draft,
    title: draft.title.trim(),
    path: draft.path.trim(),
    order: Number.isFinite(Number(draft.order)) ? Number(draft.order) : navigation.value.length + 1,
  }

  if (editingNavigationId.value) {
    navigation.value = navigation.value.map(item => item.id === editingNavigationId.value ? nextItem : item)
  } else {
    navigation.value = [...navigation.value, nextItem]
    currentPage.value = totalPages.value
  }

  closeDialogNow()
}

function requestNavigationRemoval(item: AdminNavigationItem) {
  navigationToDelete.value = item
}

function handleDeleteDialogOpenChange(value: boolean) {
  if (!value) {
    navigationToDelete.value = null
  }
}

function removeNavigation() {
  const item = navigationToDelete.value

  if (!item) {
    return
  }

  navigation.value = navigation.value
    .filter(navigationItem => navigationItem.id !== item.id)
    .map(navigationItem => navigationItem.parentId === item.id ? { ...navigationItem, parentId: '' } : navigationItem)
  currentPage.value = Math.min(currentPage.value, totalPages.value)
  navigationToDelete.value = null
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

const navigationLookup = computed(() => new Map(navigation.value.map(item => [item.id, item.title || '未命名导航'])))
const totalPages = computed(() => Math.max(1, Math.ceil(navigation.value.length / PAGE_SIZE)))
const paginatedNavigation = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return navigation.value.slice(start, start + PAGE_SIZE)
})
const saveStateLabel = computed(() => savingSection.value === 'navigation'
  ? '保存中'
  : settingsDirty.value ? '待保存' : '已保存')

watch(totalPages, (value) => {
  currentPage.value = Math.min(currentPage.value, value)
})

function goToPage(page: number) {
  currentPage.value = Math.min(Math.max(page, 1), totalPages.value)
}

const headerActions = computed(() => [
  {
    label: '新增导航',
    icon: 'lucide:plus',
    variant: 'secondary' as const,
    disabled: pending.value,
    onClick: openCreateDialog,
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

    <UiCard class="overflow-hidden p-0">
      <div class="flex min-h-14 items-center justify-between gap-4 border-b border-[var(--border-soft)] px-5 py-3">
        <div>
          <h2 class="text-sm font-semibold text-[var(--text-primary)]">菜单项目</h2>
          <p class="mt-1 text-xs text-[var(--text-secondary)]">维护导航层级、链接类型和展示状态。</p>
        </div>
        <span class="inline-flex shrink-0 items-center gap-2 text-xs font-medium text-[var(--text-secondary)]">
          <Icon :name="savingSection === 'navigation' ? 'lucide:loader-circle' : settingsDirty ? 'lucide:circle-dot' : 'lucide:circle-check'" :class="['size-4', savingSection === 'navigation' && 'animate-spin']" />
          {{ saveStateLabel }}
        </span>
      </div>

      <UiTable
        class="min-w-[1000px]"
        :columns="navigationColumns"
        :items="paginatedNavigation"
        row-key="id"
        :loading="pending"
        loading-text="正在加载导航"
        :error="error?.message"
        empty-text="暂无导航"
        pagination
        :page="currentPage"
        :items-per-page="PAGE_SIZE"
        :total="navigation.length"
        @retry="refresh"
        @update:page="goToPage"
      >
        <template #cell-title="{ item }">
          <span class="font-medium text-[var(--text-primary)]">{{ item.title || '未命名导航' }}</span>
        </template>
        <template #cell-path="{ item }">
          <code class="text-xs text-[var(--text-secondary)]">{{ item.path }}</code>
        </template>
        <template #cell-type="{ item }">
          <UiBadge variant="secondary">{{ item.type === 'external' ? '站外' : '站内' }}</UiBadge>
        </template>
        <template #cell-parent="{ item }">
          <span class="text-[var(--text-secondary)]">{{ navigationLookup.get(item.parentId) || '顶级导航' }}</span>
        </template>
        <template #cell-order="{ item }">
          <span class="tabular-nums text-[var(--text-secondary)]">{{ item.order }}</span>
        </template>
        <template #cell-enabled="{ item }">
          <UiLabel class="inline-flex items-center gap-2">
            <UiCheckbox v-model="item.enabled" :disabled="savingSection === 'navigation'" />
            <span class="text-xs text-[var(--text-secondary)]">{{ item.enabled ? '显示' : '隐藏' }}</span>
          </UiLabel>
        </template>
        <template #cell-actions="{ item }">
          <div class="flex justify-end gap-1">
            <UiTooltip>
              <UiTooltipTrigger as-child>
                <UiButton variant="ghost" size="icon-sm" :disabled="savingSection === 'navigation'" aria-label="编辑导航" @click="openEditDialog(item)">
                  <Icon name="lucide:pencil" class="size-4" />
                </UiButton>
              </UiTooltipTrigger>
              <UiTooltipContent>编辑导航</UiTooltipContent>
            </UiTooltip>
            <UiTooltip>
              <UiTooltipTrigger as-child>
                <UiButton variant="ghost" size="icon-sm" :disabled="savingSection === 'navigation'" aria-label="删除导航" @click="requestNavigationRemoval(item)">
                  <Icon name="lucide:trash-2" class="size-4 text-[var(--danger)]" />
                </UiButton>
              </UiTooltipTrigger>
              <UiTooltipContent>删除导航</UiTooltipContent>
            </UiTooltip>
          </div>
        </template>
      </UiTable>
    </UiCard>

    <UiDialog :open="dialogOpen" @update:open="handleDialogOpenChange">
      <UiDialogContent size="lg">
        <form v-if="navigationDraft" class="space-y-6" @submit.prevent="submitNavigation">
          <UiDialogHeader>
            <UiDialogTitle>{{ editingNavigationId ? '编辑导航' : '新增导航' }}</UiDialogTitle>
            <UiDialogDescription>维护导航标题、地址、层级和展示状态。</UiDialogDescription>
          </UiDialogHeader>

          <div class="space-y-4 overflow-y-auto">
            <UiLabel class="block space-y-2">
              <span class="text-sm font-medium text-[var(--text-primary)]">标题</span>
              <UiInput v-model="navigationDraft.title" class="w-full max-w-xl" placeholder="导航标题" required />
            </UiLabel>
            <UiLabel class="block space-y-2">
              <span class="text-sm font-medium text-[var(--text-primary)]">链接</span>
              <UiInput v-model="navigationDraft.path" class="w-full max-w-xl" placeholder="/posts 或 https://example.com" required />
            </UiLabel>
            <UiLabel class="block space-y-2">
              <span class="text-sm font-medium text-[var(--text-primary)]">类型</span>
              <UiSelect v-model="navigationDraft.type">
                <UiSelectTrigger class="w-full max-w-xl">
                  <UiSelectValue placeholder="链接类型" />
                </UiSelectTrigger>
                <UiSelectContent>
                  <UiSelectItem value="internal">站内</UiSelectItem>
                  <UiSelectItem value="external">站外</UiSelectItem>
                </UiSelectContent>
              </UiSelect>
            </UiLabel>
            <UiLabel class="block space-y-2">
              <span class="text-sm font-medium text-[var(--text-primary)]">上级导航</span>
              <UiSelect :model-value="getParentValue(navigationDraft)" @update:model-value="updateParent(navigationDraft, $event)">
                <UiSelectTrigger class="w-full max-w-xl">
                  <UiSelectValue placeholder="顶级导航" />
                </UiSelectTrigger>
                <UiSelectContent>
                  <UiSelectItem :value="NAVIGATION_ROOT_VALUE">顶级导航</UiSelectItem>
                  <UiSelectItem v-for="parent in getParentOptions(navigationDraft.id)" :key="parent.id" :value="parent.id">
                    {{ parent.title || '未命名导航' }}
                  </UiSelectItem>
                </UiSelectContent>
              </UiSelect>
            </UiLabel>
            <UiLabel class="block space-y-2">
              <span class="text-sm font-medium text-[var(--text-primary)]">排序</span>
              <UiInput v-model.number="navigationDraft.order" class="w-full max-w-xl" type="number" min="1" />
            </UiLabel>
            <UiLabel class="flex items-center gap-2">
              <UiCheckbox v-model="navigationDraft.enabled" />
              <span class="text-sm font-medium text-[var(--text-primary)]">在前台显示</span>
            </UiLabel>
          </div>

          <UiDialogFooter>
            <UiButton type="button" variant="outline" @click="requestDialogClose">取消</UiButton>
            <UiButton type="submit">
              <Icon name="lucide:save" class="size-4" />
              保存到列表
            </UiButton>
          </UiDialogFooter>
        </form>
      </UiDialogContent>
    </UiDialog>

    <AdminDiscardChangesDialog v-model:open="discardDialogOpen" @confirm="discardDraft" />

    <UiAlertDialog :open="Boolean(navigationToDelete)" @update:open="handleDeleteDialogOpenChange">
      <UiAlertDialogContent>
        <UiAlertDialogHeader>
          <UiAlertDialogTitle>删除导航“{{ navigationToDelete?.title || '未命名导航' }}”？</UiAlertDialogTitle>
          <UiAlertDialogDescription>删除后，现有子导航会自动移动到顶级；更改仍需点击“保存导航”才会提交。</UiAlertDialogDescription>
        </UiAlertDialogHeader>
        <UiAlertDialogFooter>
          <UiAlertDialogCancel>取消</UiAlertDialogCancel>
          <UiAlertDialogAction variant="destructive" @click="removeNavigation">确认删除</UiAlertDialogAction>
        </UiAlertDialogFooter>
      </UiAlertDialogContent>
    </UiAlertDialog>
  </div>
</template>
