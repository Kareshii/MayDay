<script setup lang="ts">
interface CategoryItem {
  id: string
  name: string
  slug: string
  parentId: string
  order: number
  description: string
}

definePageMeta({
  layout: 'admin',
})

useSeoMeta({
  title: '分类管理',
  description: '维护文章分类、层级和排序。',
})

const saving = ref(false)
const { showSuccessToast, showErrorToast } = useAdminToast()

const { data, pending, error, refresh } = await useFetch<{ categories: CategoryItem[] }>('/api/admin/features')
const categories = ref<CategoryItem[]>([])

watch(data, (value) => {
  categories.value = (value?.categories || []).map(item => ({ ...item }))
}, { immediate: true })

function createLocalId() {
  return globalThis.crypto?.randomUUID?.() || `category-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

const currentCategory = ref<CategoryItem>({
  id: '',
  name: '',
  slug: '',
  parentId: '',
  order: 1,
  description: ''
})
const isEditing = ref(false)

function startNewCategory() {
  currentCategory.value = {
    id: createLocalId(),
    name: '',
    slug: '',
    parentId: '',
    order: categories.value.length + 1,
    description: ''
  }
  isEditing.value = false
}

// Initialize form
watch(categories, (val) => {
  if (val && !currentCategory.value.id) {
    startNewCategory()
  }
}, { immediate: true })

function editCategory(item: CategoryItem) {
  currentCategory.value = { ...item }
  isEditing.value = true
}

function submitCategory() {
  if (!currentCategory.value.name) {
    showErrorToast('提示', '分类名称不能为空')
    return
  }
  if (!currentCategory.value.slug) {
    currentCategory.value.slug = currentCategory.value.name
  }
  
  if (isEditing.value) {
    const index = categories.value.findIndex(c => c.id === currentCategory.value.id)
    if (index !== -1) {
      categories.value[index] = { ...currentCategory.value }
    }
  } else {
    categories.value.push({ ...currentCategory.value })
  }
  startNewCategory()
}

function removeCategory(id: string) {
  categories.value = categories.value.filter(item => item.id !== id)
  categories.value.forEach((item) => {
    if (item.parentId === id) {
      item.parentId = ''
    }
  })
  if (currentCategory.value.id === id) {
    startNewCategory()
  }
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

const headerActions = computed(() => [
  {
    label: '保存分类',
    disabled: saving.value || pending.value,
    onClick: saveCategories,
  },
])

watch(error, (value) => {
  if (value) {
    showErrorToast('分类加载失败', value.message)
  }
}, { immediate: true })

const treeCategories = computed(() => {
  const map = new Map<string, CategoryItem[]>()
  categories.value.forEach(c => {
    const p = c.parentId || ''
    if (!map.has(p)) map.set(p, [])
    map.get(p)!.push(c)
  })

  map.forEach(group => group.sort((a, b) => a.order - b.order))

  const result: (CategoryItem & { depth: number })[] = []
  
  function traverse(parentId: string, depth: number) {
    const children = map.get(parentId) || []
    for (const child of children) {
      result.push({ ...child, depth })
      traverse(child.id, depth + 1)
    }
  }
  
  traverse('', 0)
  return result
})
</script>

<template>
  <div class="cms-page space-y-3">
    <AdminPageHeader title="分类管理" subtitle="" :actions="headerActions" />

    <div v-if="pending" class="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-card)] px-6 py-14 text-center text-sm text-[var(--text-secondary)]">
      正在加载分类...
    </div>

    <div v-else class="grid grid-cols-1 gap-6 md:grid-cols-[320px_1fr] lg:grid-cols-[360px_1fr] items-start">
      <!-- 左侧表单 -->
      <UiCard class="sticky top-6 p-5">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-bold text-[var(--text-primary)]">
            {{ isEditing ? '编辑分类' : '添加新分类' }}
          </h3>
          <UiButton v-if="isEditing" variant="ghost" size="sm" class="h-8 px-2 text-xs" @click="startNewCategory">
            取消编辑
          </UiButton>
        </div>
        
        <form class="space-y-4" @submit.prevent="submitCategory">
          <label class="block space-y-1.5">
            <span class="text-sm font-medium text-[var(--text-primary)]">名称</span>
            <UiInput v-model="currentCategory.name" placeholder="例如：技术分享" required />
          </label>
          
          <label class="block space-y-1.5">
            <span class="text-sm font-medium text-[var(--text-primary)]">别名 (Slug)</span>
            <UiInput v-model="currentCategory.slug" placeholder="例如：tech" />
            <span class="text-xs text-[var(--text-secondary)]">用于 URL 的友好标识，默认为名称。</span>
          </label>
          
          <label class="block space-y-1.5">
            <span class="text-sm font-medium text-[var(--text-primary)]">父级分类</span>
            <select v-model="currentCategory.parentId" class="h-10 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface-card)] px-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--focus-ring)]">
              <option value="">无</option>
              <option
                v-for="parent in categories.filter(category => category.id !== currentCategory.id)"
                :key="parent.id"
                :value="parent.id"
              >
                {{ parent.name }}
              </option>
            </select>
          </label>
          
          <label class="block space-y-1.5">
            <span class="text-sm font-medium text-[var(--text-primary)]">排序</span>
            <UiInput v-model.number="currentCategory.order" type="number" />
          </label>
          
          <label class="block space-y-1.5">
            <span class="text-sm font-medium text-[var(--text-primary)]">描述</span>
            <UiTextarea v-model="currentCategory.description" placeholder="分类说明（可选）" class="min-h-24" />
          </label>
          
          <UiButton type="submit" class="w-full">
            {{ isEditing ? '更新分类' : '添加分类' }}
          </UiButton>
        </form>
      </UiCard>

      <!-- 右侧列表 -->
      <UiCard class="overflow-hidden p-0">
        <div v-if="!treeCategories.length" class="px-6 py-14 text-center text-sm text-[var(--text-secondary)]">
          暂无分类，请在左侧添加。
        </div>

        <UiTable v-else>
          <UiTableHeader>
            <UiTableRow class="hover:bg-transparent">
              <UiTableHead class="w-1/2 px-6">名称</UiTableHead>
              <UiTableHead class="w-1/4">别名</UiTableHead>
              <UiTableHead class="w-1/4 text-right px-6">操作</UiTableHead>
            </UiTableRow>
          </UiTableHeader>
          <UiTableBody>
            <UiTableRow
              v-for="item in treeCategories"
              :key="item.id"
              class="group"
            >
              <UiTableCell class="px-6 py-3 font-medium text-[var(--text-primary)]">
                <div class="flex items-center gap-2">
                  <span v-if="item.depth > 0" class="text-[var(--text-muted)] opacity-50 select-none">
                    {{ '— '.repeat(item.depth) }}
                  </span>
                  <span>{{ item.name }}</span>
                </div>
                <div v-if="item.description" class="mt-1 text-xs text-[var(--text-secondary)] line-clamp-1 max-w-[300px]">
                  <span v-if="item.depth > 0" class="invisible">{{ '— '.repeat(item.depth) }}</span>
                  {{ item.description }}
                </div>
              </UiTableCell>
              
              <UiTableCell class="text-[var(--text-secondary)]">
                {{ item.slug }}
              </UiTableCell>
              
              <UiTableCell class="px-6 text-right">
                <div class="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 sm:opacity-100">
                  <UiButton variant="ghost" size="sm" class="text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30" @click="editCategory(item)">
                    编辑
                  </UiButton>
                  <UiButton variant="ghost" size="sm" class="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" @click="removeCategory(item.id)">
                    删除
                  </UiButton>
                </div>
              </UiTableCell>
            </UiTableRow>
          </UiTableBody>
        </UiTable>
      </UiCard>
    </div>
  </div>
</template>
