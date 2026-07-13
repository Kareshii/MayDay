<script setup lang="ts">
import type { TableColumn } from '@/components/ui/table'

interface CategoryItem {
  id: string
  name: string
  slug: string
  parentId: string
  order: number
  description: string
}

interface CategoryListItem extends CategoryItem {
  depth: number
  parentName: string
}

definePageMeta({
  layout: 'admin',
})

useSeoMeta({
  title: '分类管理',
  description: '维护文章分类、层级和排序。',
})

const PAGE_SIZE = 20
const PARENT_NONE_VALUE = '__none__'
const categoryColumns = [
  { prop: 'name', label: '名称', minWidth: 240 },
  { prop: 'parentName', label: '父级', minWidth: 160 },
  { prop: 'slug', label: '别名', minWidth: 160 },
  { prop: 'order', label: '排序', width: 88 },
  { prop: 'description', label: '描述', minWidth: 240 },
  { prop: 'actions', label: '操作', width: 104, align: 'right' },
] satisfies readonly TableColumn[]

const saving = ref(false)
const categories = ref<CategoryItem[]>([])
const currentPage = ref(1)
const dialogOpen = ref(false)
const isEditing = ref(false)
const categoryToDelete = ref<CategoryItem | null>(null)
const { showSuccessToast, showErrorToast } = useAdminToast()

const { data, pending, error, refresh } = await useFetch<{ categories: CategoryItem[] }>('/api/admin/features/categories')

function createLocalId() {
  return globalThis.crypto?.randomUUID?.() || `category-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function createEmptyCategory(): CategoryItem {
  return {
    id: createLocalId(),
    name: '',
    slug: '',
    parentId: '',
    order: categories.value.length + 1,
    description: '',
  }
}

const currentCategory = ref<CategoryItem>(createEmptyCategory())
const {
  discardDialogOpen,
  captureDraft,
  requestClose: requestDialogClose,
  handleOpenChange: handleDialogOpenChange,
  discardDraft,
} = useDialogDraftGuard(currentCategory, closeDialogNow, () => saving.value)

watch(data, (value) => {
  categories.value = (value?.categories || []).map(item => ({ ...item }))
}, { immediate: true })

const categoryLookup = computed(() => {
  return new Map(categories.value.map(category => [category.id, category]))
})

const treeCategories = computed<CategoryListItem[]>(() => {
  const validIds = new Set(categories.value.map(category => category.id))
  const groups = new Map<string, CategoryItem[]>()

  categories.value.forEach((category) => {
    const parentId = category.parentId && validIds.has(category.parentId) ? category.parentId : ''

    if (!groups.has(parentId)) {
      groups.set(parentId, [])
    }

    groups.get(parentId)!.push(category)
  })

  groups.forEach(group => group.sort((left, right) => left.order - right.order || left.name.localeCompare(right.name)))

  const result: CategoryListItem[] = []
  const visited = new Set<string>()

  function walk(parentId: string, depth: number) {
    for (const category of groups.get(parentId) || []) {
      if (visited.has(category.id)) {
        continue
      }

      visited.add(category.id)
      result.push({
        ...category,
        depth,
        parentName: categoryLookup.value.get(category.parentId)?.name || '无',
      })
      walk(category.id, depth + 1)
    }
  }

  walk('', 0)

  categories.value.forEach((category) => {
    if (!visited.has(category.id)) {
      result.push({
        ...category,
        depth: 0,
        parentName: categoryLookup.value.get(category.parentId)?.name || '无',
      })
    }
  })

  return result
})

const totalPages = computed(() => Math.max(1, Math.ceil(treeCategories.value.length / PAGE_SIZE)))

const paginatedCategories = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return treeCategories.value.slice(start, start + PAGE_SIZE)
})

watch(totalPages, (value) => {
  currentPage.value = Math.min(currentPage.value, value)
})

function goToPage(nextPage: number) {
  currentPage.value = Math.min(Math.max(1, nextPage), totalPages.value)
}

function collectDescendantIds(categoryId: string) {
  const result = new Set<string>()
  const walk = (parentId: string) => {
    categories.value
      .filter(category => category.parentId === parentId)
      .forEach((category) => {
        if (result.has(category.id)) {
          return
        }

        result.add(category.id)
        walk(category.id)
      })
  }

  walk(categoryId)
  return result
}

const parentOptions = computed(() => {
  const excludedIds = isEditing.value
    ? new Set([currentCategory.value.id, ...collectDescendantIds(currentCategory.value.id)])
    : new Set<string>()

  return treeCategories.value.filter(category => !excludedIds.has(category.id))
})

const selectedParentId = computed({
  get() {
    return currentCategory.value.parentId || PARENT_NONE_VALUE
  },
  set(value: string) {
    currentCategory.value.parentId = value === PARENT_NONE_VALUE ? '' : value
  },
})

const headerActions = computed(() => [
  {
    label: '新建分类',
    icon: 'lucide:plus',
    variant: 'default' as const,
    disabled: saving.value || pending.value,
    onClick: openCreateDialog,
  },
])

watch(error, (value) => {
  if (value) {
    showErrorToast('分类加载失败', value.message)
  }
}, { immediate: true })

function openCreateDialog() {
  currentCategory.value = createEmptyCategory()
  isEditing.value = false
  captureDraft()
  dialogOpen.value = true
}

function editCategory(item: CategoryItem) {
  currentCategory.value = { ...item }
  isEditing.value = true
  captureDraft()
  dialogOpen.value = true
}

function closeDialogNow() {
  dialogOpen.value = false
}

function requestCategoryRemoval(item: CategoryItem) {
  categoryToDelete.value = item
}

function handleDeleteDialogOpenChange(value: boolean) {
  if (!value && !saving.value) {
    categoryToDelete.value = null
  }
}

function normalizeCurrentCategory() {
  const name = currentCategory.value.name.trim()
  const slug = currentCategory.value.slug.trim() || name
  const order = Number(currentCategory.value.order)

  return {
    ...currentCategory.value,
    name,
    slug,
    parentId: currentCategory.value.parentId.trim(),
    order: Number.isFinite(order) ? order : categories.value.length + 1,
    description: currentCategory.value.description.trim(),
  }
}

async function submitCategory() {
  const category = normalizeCurrentCategory()

  if (!category.name) {
    showErrorToast('提示', '分类名称不能为空')
    return
  }

  let nextCategories: CategoryItem[]

  if (isEditing.value) {
    const index = categories.value.findIndex(item => item.id === category.id)

    if (index === -1) {
      showErrorToast('保存失败', '分类不存在或已被删除')
      return
    }

    nextCategories = categories.value.map(item => item.id === category.id ? category : item)
  } else {
    nextCategories = [...categories.value, category]
  }

  const saved = await persistCategories(
    nextCategories,
    isEditing.value ? '分类已更新' : '分类已创建',
  )

  if (saved) {
    currentPage.value = isEditing.value ? currentPage.value : totalPages.value
    closeDialogNow()
  }
}

async function removeCategory() {
  const category = categoryToDelete.value

  if (!category || saving.value) {
    return
  }

  const nextCategories = categories.value
    .filter(item => item.id !== category.id)
    .map(item => item.parentId === category.id ? { ...item, parentId: '' } : item)

  const saved = await persistCategories(nextCategories, '分类已删除')

  if (saved) {
    if (currentCategory.value.id === category.id) {
      closeDialogNow()
    }

    currentPage.value = Math.min(currentPage.value, totalPages.value)
    categoryToDelete.value = null
  }
}

async function persistCategories(nextCategories: CategoryItem[], successMessage: string) {
  if (saving.value) {
    return false
  }

  saving.value = true

  try {
    const response = await $fetch<{ categories: CategoryItem[] }>('/api/admin/features/categories', {
      method: 'PUT',
      body: {
        categories: nextCategories,
      },
    })

    categories.value = response.categories.map(item => ({ ...item }))
    showSuccessToast(successMessage)
    return true
  } catch (err) {
    showErrorToast('保存失败', getRequestErrorMessage(err, '保存失败'))
    return false
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="cms-page space-y-4">
    <AdminPageHeader title="分类管理" subtitle="文章分类与层级结构" :actions="headerActions" />

    <UiCard class="overflow-hidden p-0">
      <UiTable
        class="min-w-[960px]"
        :columns="categoryColumns"
        :items="paginatedCategories"
        row-key="id"
        :loading="pending"
        loading-text="正在加载分类"
        :error="error?.message"
        empty-text="暂无分类"
        pagination
        :page="currentPage"
        :items-per-page="PAGE_SIZE"
        :total="treeCategories.length"
        @retry="refresh"
        @update:page="goToPage"
      >
        <template #cell-name="{ item }">
          <div class="flex min-w-0 items-center gap-2" :style="{ paddingInlineStart: `${Math.min(item.depth, 4) * 16}px` }">
            <Icon :name="item.depth ? 'lucide:corner-down-right' : 'lucide:folder'" class="size-4 shrink-0 text-[var(--text-muted)]" />
            <span class="truncate font-medium text-[var(--text-primary)]">{{ item.name }}</span>
            <UiBadge variant="outline">{{ item.depth + 1 }} 级</UiBadge>
          </div>
        </template>

        <template #cell-parentName="{ item }">
          <span class="text-[var(--text-secondary)]">{{ item.parentName }}</span>
        </template>

        <template #cell-slug="{ item }">
          <code class="text-xs text-[var(--text-secondary)]">{{ item.slug }}</code>
        </template>

        <template #cell-order="{ item }">
          <span class="tabular-nums text-[var(--text-secondary)]">{{ item.order }}</span>
        </template>

        <template #cell-description="{ item }">
          <p class="line-clamp-2 text-xs leading-5 text-[var(--text-secondary)]">{{ item.description || '暂无描述' }}</p>
        </template>

        <template #cell-actions="{ item }">
          <div class="flex justify-end gap-1">
            <UiTooltip>
              <UiTooltipTrigger as-child>
                <UiButton variant="ghost" size="icon-sm" :disabled="saving" aria-label="编辑分类" @click="editCategory(item)">
                  <Icon name="lucide:pencil" class="size-4" />
                </UiButton>
              </UiTooltipTrigger>
              <UiTooltipContent>编辑分类</UiTooltipContent>
            </UiTooltip>
            <UiTooltip>
              <UiTooltipTrigger as-child>
                <UiButton variant="ghost" size="icon-sm" :disabled="saving" aria-label="删除分类" @click="requestCategoryRemoval(item)">
                  <Icon name="lucide:trash-2" class="size-4 text-[var(--danger)]" />
                </UiButton>
              </UiTooltipTrigger>
              <UiTooltipContent>删除分类</UiTooltipContent>
            </UiTooltip>
          </div>
        </template>
      </UiTable>
    </UiCard>

    <UiDialog :open="dialogOpen" @update:open="handleDialogOpenChange">
      <UiDialogContent size="md" :show-close-button="!saving">
        <form class="space-y-6" @submit.prevent="submitCategory">
          <UiDialogHeader>
            <UiDialogTitle>{{ isEditing ? '编辑分类' : '新建分类' }}</UiDialogTitle>
            <UiDialogDescription>维护分类名称、层级、别名和排序。</UiDialogDescription>
          </UiDialogHeader>

          <div class="space-y-4 overflow-y-auto">
            <UiLabel class="block space-y-2">
              <span class="text-sm font-medium text-[var(--text-primary)]">名称 <span class="text-[var(--danger)]">*</span></span>
              <UiInput v-model="currentCategory.name" class="w-full max-w-xl" :disabled="saving" placeholder="例如：技术分享" required />
            </UiLabel>

            <UiLabel class="block space-y-2">
              <span class="text-sm font-medium text-[var(--text-primary)]">别名</span>
              <UiInput v-model="currentCategory.slug" class="w-full max-w-xl" :disabled="saving" placeholder="例如：tech" />
            </UiLabel>

            <UiLabel class="block space-y-2">
              <span class="text-sm font-medium text-[var(--text-primary)]">父级分类</span>
              <UiSelect v-model="selectedParentId" :disabled="saving">
                <UiSelectTrigger class="w-full max-w-xl">
                  <UiSelectValue placeholder="选择父级分类" />
                </UiSelectTrigger>
                <UiSelectContent>
                  <UiSelectItem :value="PARENT_NONE_VALUE">无</UiSelectItem>
                  <UiSelectItem v-for="parent in parentOptions" :key="parent.id" :value="parent.id">
                    {{ `${'— '.repeat(parent.depth)}${parent.name}` }}
                  </UiSelectItem>
                </UiSelectContent>
              </UiSelect>
            </UiLabel>

            <UiLabel class="block space-y-2">
              <span class="text-sm font-medium text-[var(--text-primary)]">排序</span>
              <UiInput v-model.number="currentCategory.order" class="w-full max-w-xl" :disabled="saving" type="number" min="1" />
            </UiLabel>

            <UiLabel class="block space-y-2">
              <span class="text-sm font-medium text-[var(--text-primary)]">描述</span>
              <UiTextarea v-model="currentCategory.description" class="max-w-xl" :disabled="saving" placeholder="分类说明（可选）" />
            </UiLabel>
          </div>

          <UiDialogFooter>
            <UiButton type="button" variant="outline" :disabled="saving" @click="requestDialogClose">取消</UiButton>
            <UiButton type="submit" :disabled="saving">
              <Icon :name="saving ? 'lucide:loader-circle' : 'lucide:save'" :class="['size-4', saving && 'animate-spin']" />
              {{ saving ? '保存中...' : '保存分类' }}
            </UiButton>
          </UiDialogFooter>
        </form>
      </UiDialogContent>
    </UiDialog>

    <AdminDiscardChangesDialog v-model:open="discardDialogOpen" @confirm="discardDraft" />

    <UiAlertDialog :open="Boolean(categoryToDelete)" @update:open="handleDeleteDialogOpenChange">
      <UiAlertDialogContent>
        <UiAlertDialogHeader>
          <UiAlertDialogTitle>删除分类“{{ categoryToDelete?.name }}”？</UiAlertDialogTitle>
          <UiAlertDialogDescription>删除后不可恢复，现有子分类会自动变为顶级分类。</UiAlertDialogDescription>
        </UiAlertDialogHeader>
        <UiAlertDialogFooter>
          <UiAlertDialogCancel :disabled="saving">取消</UiAlertDialogCancel>
          <UiAlertDialogAction variant="destructive" :disabled="saving" @click="removeCategory">
            {{ saving ? '删除中...' : '确认删除' }}
          </UiAlertDialogAction>
        </UiAlertDialogFooter>
      </UiAlertDialogContent>
    </UiAlertDialog>
  </div>
</template>
