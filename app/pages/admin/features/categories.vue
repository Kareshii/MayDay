<script setup lang="ts">
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

const saving = ref(false)
const categories = ref<CategoryItem[]>([])
const currentPage = ref(1)
const dialogOpen = ref(false)
const isEditing = ref(false)
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

const headerActions = computed(() => [
  {
    label: '保存分类',
    icon: 'lucide:save',
    variant: 'outline' as const,
    disabled: saving.value || pending.value,
    onClick: saveCategories,
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

function submitCategory() {
  const category = normalizeCurrentCategory()

  if (!category.name) {
    showErrorToast('提示', '分类名称不能为空')
    return
  }

  if (isEditing.value) {
    const index = categories.value.findIndex(item => item.id === category.id)

    if (index !== -1) {
      categories.value[index] = category
    }
  } else {
    categories.value.push(category)
    currentPage.value = totalPages.value
  }

  closeDialog()
}

function removeCategory(id: string) {
  if (import.meta.client && !window.confirm('确认删除这个分类吗？子分类会变为无父级，保存后生效。')) {
    return
  }

  categories.value = categories.value
    .filter(item => item.id !== id)
    .map(item => item.parentId === id ? { ...item, parentId: '' } : item)

  if (currentCategory.value.id === id) {
    closeDialog()
  }

  currentPage.value = Math.min(currentPage.value, totalPages.value)
}

async function saveCategories() {
  saving.value = true

  try {
    await $fetch('/api/admin/features/categories', {
      method: 'PUT',
      body: {
        categories: categories.value,
      },
    })
    await refresh()
    showSuccessToast('分类已保存')
  } catch (err) {
    showErrorToast('保存失败', getRequestErrorMessage(err, '保存失败'))
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="cms-page space-y-3">
    <AdminPageHeader title="分类管理" subtitle="" :actions="headerActions" />

    <div v-if="pending" class="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-card)] px-6 py-14 text-center text-sm text-[var(--text-secondary)]">
      正在加载分类...
    </div>

    <UiCard v-else class="overflow-hidden p-0">
      <div class="flex flex-col gap-3 border-b border-[var(--border-soft)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">
            分类列表
          </p>
          <p class="mt-1 text-xs text-[var(--text-secondary)]">
            共 {{ treeCategories.length }} 个分类
          </p>
        </div>
        <UiButton size="sm" class="h-8 gap-1.5 px-2.5 text-xs" @click="openCreateDialog">
          <Icon name="lucide:plus" class="size-3.5" />
          新建分类
        </UiButton>
      </div>

      <div v-if="!treeCategories.length" class="px-6 py-14 text-center text-sm text-[var(--text-secondary)]">
        暂无分类。
      </div>

      <div v-else class="overflow-x-auto">
        <UiTable class="min-w-[900px]">
          <UiTableHeader>
            <UiTableRow class="hover:bg-transparent">
              <UiTableHead class="px-6">
                名称
              </UiTableHead>
              <UiTableHead class="w-[12rem]">
                父级
              </UiTableHead>
              <UiTableHead class="w-[12rem]">
                别名
              </UiTableHead>
              <UiTableHead class="w-[6rem]">
                排序
              </UiTableHead>
              <UiTableHead>
                描述
              </UiTableHead>
              <UiTableHead class="w-[10rem] px-6 text-right">
                操作
              </UiTableHead>
            </UiTableRow>
          </UiTableHeader>
          <UiTableBody>
            <UiTableRow
              v-for="item in paginatedCategories"
              :key="item.id"
            >
              <UiTableCell class="px-6 py-4">
                <div class="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
                  <span
                    v-if="item.depth > 0"
                    class="select-none text-[var(--text-muted)]"
                  >
                    {{ '— '.repeat(item.depth) }}
                  </span>
                  <Icon name="lucide:folder" class="size-4 text-[var(--primary)]" />
                  <span>{{ item.name }}</span>
                </div>
              </UiTableCell>
              <UiTableCell class="text-[var(--text-secondary)]">
                {{ item.parentName }}
              </UiTableCell>
              <UiTableCell class="font-medium text-[var(--text-secondary)]">
                {{ item.slug }}
              </UiTableCell>
              <UiTableCell class="text-[var(--text-secondary)]">
                {{ item.order }}
              </UiTableCell>
              <UiTableCell class="max-w-[22rem] text-[var(--text-secondary)]">
                <span class="line-clamp-1">
                  {{ item.description || '—' }}
                </span>
              </UiTableCell>
              <UiTableCell class="px-6">
                <div class="flex justify-end gap-2">
                  <UiButton variant="ghost" size="sm" @click="editCategory(item)">
                    编辑
                  </UiButton>
                  <UiButton variant="ghost" size="sm" class="text-red-600 hover:text-red-500" @click="removeCategory(item.id)">
                    删除
                  </UiButton>
                </div>
              </UiTableCell>
            </UiTableRow>
          </UiTableBody>
        </UiTable>

        <div class="flex flex-col gap-3 border-t border-[var(--border-soft)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p class="text-sm text-[var(--text-secondary)]">
            显示 {{ pageStart }} - {{ pageEnd }} / {{ treeCategories.length }}
          </p>
          <UiPagination
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
              <template
                v-for="(item, index) in items"
                :key="item.type === 'page' ? item.value : `ellipsis-${index}`"
              >
                <UiPaginationListItem
                  v-if="item.type === 'page'"
                  :value="item.value"
                >
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

    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="dialogOpen"
          class="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="分类编辑"
          @mousedown.self="closeDialog"
        >
          <form
            class="flex max-h-[calc(100dvh-4rem)] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-[var(--surface-card)] shadow-lg animate-in fade-in-0 zoom-in-95 duration-300 ease-out"
            @submit.prevent="submitCategory"
          >
            <!-- Header -->
            <div class="flex shrink-0 items-center justify-between px-6 py-5">
              <div class="flex items-center gap-3">
                <div class="flex size-10 items-center justify-center rounded-xl bg-[var(--primary)]/5 text-[var(--primary)]">
                  <Icon :name="isEditing ? 'lucide:pencil' : 'lucide:folder-plus'" class="size-5" />
                </div>
                <div>
                  <h2 class="text-base font-semibold text-[var(--text-primary)]">
                    {{ isEditing ? '编辑分类' : '新建分类' }}
                  </h2>
                  <p class="mt-0.5 text-xs text-[var(--text-secondary)]">
                    {{ currentCategory.name || '未命名分类' }}
                  </p>
                </div>
              </div>
              <UiButton type="button" variant="ghost" size="icon" class="size-8 rounded-full" aria-label="关闭弹窗" @click="closeDialog">
                <Icon name="lucide:x" class="size-4" />
              </UiButton>
            </div>

            <!-- Body -->
            <div class="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 pb-2">
              <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <label class="block space-y-2">
                  <span class="text-sm font-medium text-[var(--text-primary)]">名称 <span class="text-red-500">*</span></span>
                  <UiInput v-model="currentCategory.name" placeholder="例如：技术分享" required class="border-transparent bg-[var(--surface-low)] transition focus:border-[var(--primary)] focus:bg-[var(--surface-card)] focus:ring-[var(--primary)]" />
                </label>

                <label class="block space-y-2">
                  <span class="text-sm font-medium text-[var(--text-primary)]">别名 (Slug)</span>
                  <UiInput v-model="currentCategory.slug" placeholder="例如：tech" class="border-transparent bg-[var(--surface-low)] transition focus:border-[var(--primary)] focus:bg-[var(--surface-card)] focus:ring-[var(--primary)]" />
                </label>
              </div>

              <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <label class="block space-y-2">
                  <span class="text-sm font-medium text-[var(--text-primary)]">父级分类</span>
                  <select
                    v-model="currentCategory.parentId"
                    class="h-10 w-full rounded-xl border border-transparent bg-[var(--surface-low)] px-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--primary)] focus:bg-[var(--surface-card)] focus:ring-2 focus:ring-[var(--primary)]"
                  >
                    <option value="">
                      无
                    </option>
                    <option
                      v-for="parent in parentOptions"
                      :key="parent.id"
                      :value="parent.id"
                    >
                      {{ `${'— '.repeat(parent.depth)}${parent.name}` }}
                    </option>
                  </select>
                </label>

                <label class="block space-y-2">
                  <span class="text-sm font-medium text-[var(--text-primary)]">排序 (越小越靠前)</span>
                  <UiInput v-model.number="currentCategory.order" type="number" min="1" class="border-transparent bg-[var(--surface-low)] transition focus:border-[var(--primary)] focus:bg-[var(--surface-card)] focus:ring-[var(--primary)]" />
                </label>
              </div>

              <label class="block space-y-2">
                <span class="text-sm font-medium text-[var(--text-primary)]">描述</span>
                <UiTextarea v-model="currentCategory.description" placeholder="分类说明（可选）" class="min-h-24 resize-none border-transparent bg-[var(--surface-low)] transition focus:border-[var(--primary)] focus:bg-[var(--surface-card)] focus:ring-[var(--primary)]" />
              </label>
            </div>

            <!-- Footer -->
            <div class="flex shrink-0 items-center justify-end gap-3 px-6 py-5">
              <UiButton type="button" variant="ghost" class="h-10 rounded-xl px-5 hover:bg-[var(--surface-low)]" @click="closeDialog">
                取消
              </UiButton>
              <UiButton type="submit" class="h-10 rounded-xl px-5">
                <Icon :name="isEditing ? 'lucide:save' : 'lucide:plus'" class="mr-2 size-4" />
                {{ isEditing ? '更新分类' : '添加分类' }}
              </UiButton>
            </div>
          </form>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
