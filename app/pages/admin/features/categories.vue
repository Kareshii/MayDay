<script setup lang="ts">
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from 'reka-ui'

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

const PAGE_SIZE = 10
const PARENT_NONE_VALUE = '__none__'

const saving = ref(false)
const categories = ref<CategoryItem[]>([])
const currentPage = ref(1)
const dialogOpen = ref(false)
const isEditing = ref(false)
const { showSuccessToast, showErrorToast } = useAdminToast()

const { data, pending, error } = await useFetch<{ categories: CategoryItem[] }>('/api/admin/features/categories')

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

const pageStart = computed(() => {
  if (!treeCategories.value.length) {
    return 0
  }

  return (currentPage.value - 1) * PAGE_SIZE + 1
})

const pageEnd = computed(() => Math.min(currentPage.value * PAGE_SIZE, treeCategories.value.length))
const rootCategoryCount = computed(() => categories.value.filter(category => !category.parentId).length)
const nestedCategoryCount = computed(() => categories.value.length - rootCategoryCount.value)
const maxCategoryDepth = computed(() => {
  return treeCategories.value.reduce((depth, category) => Math.max(depth, category.depth + 1), 0)
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
  dialogOpen.value = true
}

function editCategory(item: CategoryItem) {
  currentCategory.value = { ...item }
  isEditing.value = true
  dialogOpen.value = true
}

function closeDialog() {
  dialogOpen.value = false
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
    closeDialog()
  }
}

async function removeCategory(id: string) {
  if (saving.value) {
    return
  }

  if (import.meta.client && !window.confirm('确认删除这个分类吗？子分类会变为无父级。')) {
    return
  }

  const nextCategories = categories.value
    .filter(item => item.id !== id)
    .map(item => item.parentId === id ? { ...item, parentId: '' } : item)

  const saved = await persistCategories(nextCategories, '分类已删除')

  if (saved) {
    if (currentCategory.value.id === id) {
      closeDialog()
    }

    currentPage.value = Math.min(currentPage.value, totalPages.value)
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

    <div v-if="pending" class="flex min-h-56 items-center justify-center rounded-lg border border-[var(--border-soft)] bg-[var(--surface-card)]">
      <div class="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
        <Icon name="lucide:loader-circle" class="size-4 animate-spin text-[var(--primary)]" />
        正在加载分类
      </div>
    </div>

    <template v-else>
      <section class="grid overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--surface-card)] sm:grid-cols-3">
        <div class="flex min-h-28 items-center gap-4 border-b border-[var(--border-soft)] px-5 py-4 sm:border-b-0 sm:border-r">
          <div class="grid size-10 shrink-0 place-items-center rounded-md bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300">
            <Icon name="lucide:folders" class="size-5" />
          </div>
          <div>
            <p class="text-xs font-medium text-[var(--text-secondary)]">分类总数</p>
            <p class="mt-1 text-2xl font-bold tabular-nums text-[var(--text-primary)]">{{ treeCategories.length }}</p>
          </div>
        </div>
        <div class="flex min-h-28 items-center gap-4 border-b border-[var(--border-soft)] px-5 py-4 sm:border-b-0 sm:border-r">
          <div class="grid size-10 shrink-0 place-items-center rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
            <Icon name="lucide:folder-root" class="size-5" />
          </div>
          <div>
            <p class="text-xs font-medium text-[var(--text-secondary)]">一级分类</p>
            <p class="mt-1 text-2xl font-bold tabular-nums text-[var(--text-primary)]">{{ rootCategoryCount }}</p>
          </div>
        </div>
        <div class="flex min-h-28 items-center gap-4 px-5 py-4">
          <div class="grid size-10 shrink-0 place-items-center rounded-md bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
            <Icon name="lucide:git-branch" class="size-5" />
          </div>
          <div>
            <p class="text-xs font-medium text-[var(--text-secondary)]">子分类</p>
            <p class="mt-1 text-2xl font-bold tabular-nums text-[var(--text-primary)]">{{ nestedCategoryCount }}</p>
          </div>
        </div>
      </section>

      <UiCard class="overflow-hidden p-0">
        <div class="flex items-center justify-between gap-4 border-b border-[var(--border-soft)] px-5 py-4">
          <div class="flex min-w-0 items-center gap-3">
            <div class="grid size-8 shrink-0 place-items-center rounded-md bg-[var(--surface-high)] text-[var(--text-secondary)]">
              <Icon name="lucide:list-tree" class="size-4" />
            </div>
            <div class="min-w-0">
              <h2 class="text-sm font-semibold text-[var(--text-primary)]">分类结构</h2>
              <p class="mt-0.5 text-xs text-[var(--text-secondary)]">{{ maxCategoryDepth }} 级层级</p>
            </div>
          </div>
          <UiButton size="sm" class="h-8 gap-1.5 px-2.5 text-xs" :disabled="saving" @click="openCreateDialog">
            <Icon name="lucide:plus" class="size-3.5" />
            新建分类
          </UiButton>
        </div>

        <div v-if="!treeCategories.length" class="grid min-h-72 place-items-center px-6 text-center">
          <div>
            <div class="mx-auto grid size-11 place-items-center rounded-md bg-[var(--surface-high)] text-[var(--text-secondary)]">
              <Icon name="lucide:folder-plus" class="size-5" />
            </div>
            <p class="mt-4 text-sm font-semibold text-[var(--text-primary)]">暂无分类</p>
            <UiButton size="sm" class="mt-4" :disabled="saving" @click="openCreateDialog">
              <Icon name="lucide:plus" class="size-4" />
              新建分类
            </UiButton>
          </div>
        </div>

        <div v-else>
          <div class="hidden grid-cols-[minmax(16rem,1.4fr)_minmax(9rem,0.7fr)_minmax(8rem,0.6fr)_5rem_minmax(12rem,1fr)_5rem] gap-4 border-b border-[var(--border-soft)] bg-[var(--surface-low)] px-5 py-2.5 text-[11px] font-semibold text-[var(--text-secondary)] xl:grid">
            <span>名称</span>
            <span>父级</span>
            <span>别名</span>
            <span>排序</span>
            <span>描述</span>
            <span class="text-right">操作</span>
          </div>

          <div class="divide-y divide-[var(--border-soft)]">
            <div
              v-for="item in paginatedCategories"
              :key="item.id"
              class="group grid min-w-0 gap-3 px-4 py-4 transition-colors hover:bg-[var(--surface-low)] sm:px-5 xl:grid-cols-[minmax(16rem,1.4fr)_minmax(9rem,0.7fr)_minmax(8rem,0.6fr)_5rem_minmax(12rem,1fr)_5rem] xl:items-center xl:gap-4"
            >
              <div class="min-w-0" :style="{ paddingInlineStart: `${Math.min(item.depth, 4) * 18}px` }">
                <div class="flex min-w-0 items-center gap-2.5">
                  <Icon v-if="item.depth > 0" name="lucide:corner-down-right" class="size-3.5 shrink-0 text-[var(--text-muted)]" />
                  <div :class="['grid size-8 shrink-0 place-items-center rounded-md', item.depth === 0 ? 'bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300' : 'bg-[var(--surface-high)] text-[var(--text-secondary)]']">
                    <Icon :name="item.depth === 0 ? 'lucide:folder' : 'lucide:folder-tree'" class="size-4" />
                  </div>
                  <div class="min-w-0">
                    <div class="flex min-w-0 items-center gap-2">
                      <p class="truncate text-sm font-semibold text-[var(--text-primary)]">{{ item.name }}</p>
                      <span class="shrink-0 rounded-md border border-[var(--border-soft)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--text-secondary)]">
                        {{ item.depth + 1 }} 级
                      </span>
                    </div>
                    <p class="mt-0.5 truncate font-mono text-[11px] text-[var(--text-muted)] xl:hidden">{{ item.slug }}</p>
                  </div>
                </div>
              </div>

              <div class="flex min-w-0 items-center gap-2 text-xs text-[var(--text-secondary)]">
                <Icon name="lucide:folder-input" class="size-3.5 shrink-0 text-[var(--text-muted)]" />
                <span class="min-w-0 flex-1 truncate">{{ item.parentName }}</span>
                <span class="shrink-0 tabular-nums text-[var(--text-muted)] xl:hidden">排序 {{ item.order }}</span>
              </div>

              <code class="hidden truncate rounded-md bg-[var(--surface-high)] px-2 py-1 font-mono text-[11px] text-[var(--text-secondary)] xl:block">
                {{ item.slug }}
              </code>

              <div class="hidden xl:block">
                <span class="inline-grid size-7 place-items-center rounded-md border border-[var(--border-soft)] text-xs font-semibold tabular-nums text-[var(--text-secondary)]">
                  {{ item.order }}
                </span>
              </div>

              <p class="line-clamp-2 min-w-0 text-xs leading-5 text-[var(--text-secondary)]">
                {{ item.description || '暂无描述' }}
              </p>

              <div class="flex items-center justify-end gap-1">
                <UiButton
                  variant="ghost"
                  size="icon"
                  class="size-8"
                  :disabled="saving"
                  aria-label="编辑分类"
                  title="编辑分类"
                  @click="editCategory(item)"
                >
                  <Icon name="lucide:pencil" class="size-4" />
                </UiButton>
                <UiButton
                  variant="ghost"
                  size="icon"
                  class="size-8 text-red-600 hover:text-red-500 dark:text-red-400"
                  :disabled="saving"
                  aria-label="删除分类"
                  title="删除分类"
                  @click="removeCategory(item.id)"
                >
                  <Icon name="lucide:trash-2" class="size-4" />
                </UiButton>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-3 border-t border-[var(--border-soft)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p class="text-xs tabular-nums text-[var(--text-secondary)]">
              显示 {{ pageStart }} - {{ pageEnd }} / {{ treeCategories.length }}
            </p>
            <UiPagination
              v-if="treeCategories.length > PAGE_SIZE"
              :page="currentPage"
              :items-per-page="PAGE_SIZE"
              :total="treeCategories.length"
              :sibling-count="1"
              show-edges
              @update:page="goToPage"
            >
              <UiPaginationPrev>
                <Icon name="lucide:chevron-left" class="size-4" />
                上一页
              </UiPaginationPrev>
              <UiPaginationList v-slot="{ items }">
                <template v-for="(item, index) in items" :key="item.type === 'page' ? item.value : `ellipsis-${index}`">
                  <UiPaginationListItem v-if="item.type === 'page'" :value="item.value">
                    {{ item.value }}
                  </UiPaginationListItem>
                  <UiPaginationEllipsis v-else />
                </template>
              </UiPaginationList>
              <UiPaginationNext>
                下一页
                <Icon name="lucide:chevron-right" class="size-4" />
              </UiPaginationNext>
            </UiPagination>
          </div>
        </div>
      </UiCard>
    </template>

    <DialogRoot v-model:open="dialogOpen">
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 z-[120] bg-slate-950/45 backdrop-blur-sm" />
        <DialogContent class="fixed left-1/2 top-1/2 z-[121] flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--surface-card)] shadow-2xl outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">
          <form class="flex min-h-0 flex-1 flex-col" @submit.prevent="submitCategory">
            <div class="flex shrink-0 items-center justify-between border-b border-[var(--border-soft)] px-5 py-4 sm:px-6">
              <div class="flex items-center gap-3">
                <div class="flex size-9 items-center justify-center rounded-md bg-[var(--primary-soft)] text-[var(--primary)]">
                  <Icon :name="isEditing ? 'lucide:pencil' : 'lucide:folder-plus'" class="size-5" />
                </div>
                <div>
                  <DialogTitle class="text-base font-semibold text-[var(--text-primary)]">
                    {{ isEditing ? '编辑分类' : '新建分类' }}
                  </DialogTitle>
                  <DialogDescription class="mt-0.5 text-xs text-[var(--text-secondary)]">
                    {{ currentCategory.name || '未命名分类' }}
                  </DialogDescription>
                </div>
              </div>
              <DialogClose as-child>
                <UiButton type="button" variant="ghost" size="icon" class="size-8" aria-label="关闭弹窗" title="关闭" :disabled="saving">
                  <Icon name="lucide:x" class="size-4" />
                </UiButton>
              </DialogClose>
            </div>

            <div class="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
              <div class="grid gap-4 sm:grid-cols-2">
                <UiLabel class="space-y-2">
                  <span class="text-xs font-medium text-[var(--text-secondary)]">名称 <span class="text-red-500">*</span></span>
                  <UiInput v-model="currentCategory.name" :disabled="saving" placeholder="例如：技术分享" required class="rounded-md border-[var(--border-soft)] bg-[var(--surface-low)]" />
                </UiLabel>

                <UiLabel class="space-y-2">
                  <span class="text-xs font-medium text-[var(--text-secondary)]">别名</span>
                  <UiInput v-model="currentCategory.slug" :disabled="saving" placeholder="例如：tech" class="rounded-md border-[var(--border-soft)] bg-[var(--surface-low)] font-mono" />
                </UiLabel>
              </div>

              <div class="grid gap-4 sm:grid-cols-2">
                <UiLabel class="space-y-2">
                  <span class="text-xs font-medium text-[var(--text-secondary)]">父级分类</span>
                  <UiSelect v-model="selectedParentId" :disabled="saving">
                    <UiSelectTrigger class="rounded-md border-[var(--border-soft)] bg-[var(--surface-low)]">
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

                <UiLabel class="space-y-2">
                  <span class="text-xs font-medium text-[var(--text-secondary)]">排序</span>
                  <UiInput v-model.number="currentCategory.order" :disabled="saving" type="number" min="1" class="rounded-md border-[var(--border-soft)] bg-[var(--surface-low)]" />
                </UiLabel>
              </div>

              <UiLabel class="space-y-2">
                <span class="text-xs font-medium text-[var(--text-secondary)]">描述</span>
                <UiTextarea v-model="currentCategory.description" :disabled="saving" placeholder="分类说明（可选）" class="min-h-28 resize-none rounded-md border-[var(--border-soft)] bg-[var(--surface-low)] leading-6" />
              </UiLabel>
            </div>

            <div class="flex shrink-0 items-center justify-end gap-3 border-t border-[var(--border-soft)] px-5 py-4 sm:px-6">
              <DialogClose as-child>
                <UiButton type="button" variant="ghost" :disabled="saving">取消</UiButton>
              </DialogClose>
              <UiButton type="submit" :disabled="saving">
                <Icon :name="saving ? 'lucide:loader-circle' : isEditing ? 'lucide:save' : 'lucide:plus'" :class="['size-4', saving && 'animate-spin']" />
                {{ saving ? '保存中...' : isEditing ? '更新分类' : '添加分类' }}
              </UiButton>
            </div>
          </form>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </div>
</template>
