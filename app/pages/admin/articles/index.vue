<script setup lang="ts">
import type { ManagedArticleSummary } from '~~/shared/types/articles'

definePageMeta({
  layout: 'admin',
})

useSeoMeta({
  title: '文章管理',
  description: '搜索并管理 PostgreSQL 中的文章。',
})

const route = useRoute()
const router = useRouter()
const togglingPinnedId = ref('')
const { showSuccessToast, showErrorToast } = useAdminToast()

const { data, pending, error, refresh } = await useFetch<{ configMissing?: boolean; articles: ManagedArticleSummary[] }>('/api/admin/articles')
const headerActions = computed(() => [
  {
    label: '新建文章',
    icon: 'lucide:plus',
    to: '/admin/articles/new',
  },
])

const searchText = computed(() => typeof route.query.search === 'string' ? route.query.search : '')
const searchInput = ref('')
const status = computed<'all' | 'published' | 'draft'>(() => {
  const value = typeof route.query.status === 'string' ? route.query.status : 'all'
  return value === 'published' || value === 'draft' ? value : 'all'
})

const headerSearch = computed(() => ({
  value: searchInput.value,
  placeholder: '搜索文章...',
  label: '搜索文章',
  onUpdate: (value: string) => {
    searchInput.value = value
  },
}))

watch(
  () => route.query.search,
  (value) => {
    searchInput.value = typeof value === 'string' ? value : ''
  },
  { immediate: true },
)

watch(searchInput, async (value) => {
  const trimmed = value.trim()
  const currentSearch = typeof route.query.search === 'string' ? route.query.search : ''

  if (trimmed === currentSearch) {
    return
  }

  const query: Record<string, string> = {}

  if (trimmed) {
    query.search = trimmed
  }

  if (status.value !== 'all') {
    query.status = status.value
  }

  await router.replace({ query })
})

const filteredArticles = computed(() => {
  const keyword = searchText.value.trim().toLowerCase()

  return (data.value?.articles || []).filter((article) => {
    const matchesStatus = status.value === 'all'
      ? true
      : status.value === 'published'
        ? article.published
        : !article.published

    const matchesKeyword = keyword
      ? article.title.toLowerCase().includes(keyword) ||
        article.slug.toLowerCase().includes(keyword) ||
        article.summary.toLowerCase().includes(keyword)
      : true

    return matchesStatus && matchesKeyword
  })
})

const PAGE_SIZE = 12

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredArticles.value.length / PAGE_SIZE))
})

const currentPage = computed(() => {
  const pageParam = typeof route.query.page === 'string'
    ? Number.parseInt(route.query.page, 10)
    : 1

  if (!Number.isFinite(pageParam) || pageParam < 1) {
    return 1
  }

  return Math.min(pageParam, totalPages.value)
})

const paginatedArticles = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredArticles.value.slice(start, start + PAGE_SIZE)
})

const pageStart = computed(() => {
  if (!filteredArticles.value.length) {
    return 0
  }

  return (currentPage.value - 1) * PAGE_SIZE + 1
})

const pageEnd = computed(() => {
  return Math.min(currentPage.value * PAGE_SIZE, filteredArticles.value.length)
})

function buildPageQuery(nextPage: number) {
  const query: Record<string, string> = {}
  const keyword = searchText.value.trim()

  if (keyword) {
    query.search = keyword
  }

  if (status.value !== 'all') {
    query.status = status.value
  }

  if (nextPage > 1) {
    query.page = String(nextPage)
  }

  return query
}

async function goToPage(nextPage: number) {
  const safePage = Math.min(Math.max(1, nextPage), totalPages.value)

  if (safePage === currentPage.value) {
    return
  }

  await router.replace({ query: buildPageQuery(safePage) })
}

function getArticlePreviewTarget(article: ManagedArticleSummary) {
  return article.published
    ? { name: 'detail-slug', params: { slug: article.slug } }
    : { name: 'detail-slug', params: { slug: article.slug }, query: { preview: '1' } }
}

async function togglePinned(article: ManagedArticleSummary) {
  togglingPinnedId.value = article.id

  try {
    await $fetch(`/api/admin/articles/${article.id}/pinned`, {
      method: 'PUT',
      body: {
        pinned: !article.pinned,
      },
    })
    await refresh()
    showSuccessToast(article.pinned ? '已取消置顶' : '文章已置顶', article.title)
  } catch (err) {
    showErrorToast('置顶状态更新失败', getRequestErrorMessage(err, '置顶状态更新失败'))
  } finally {
    togglingPinnedId.value = ''
  }
}

watch(error, (value) => {
  if (value) {
    showErrorToast('文章列表加载失败', value.message)
  }
}, { immediate: true })
</script>

<template>
  <div class="cms-page space-y-3">
    <AdminPageHeader title="文章管理" subtitle="" :actions="headerActions" :search="headerSearch" />

    <div v-if="data?.configMissing" class="rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/12 dark:text-amber-200">
      `DATABASE_URL` 未配置，当前无法读取数据库文章。
    </div>

    <section class="flex justify-end">
      <p class="text-sm text-[var(--text-secondary)]">
        {{ filteredArticles.length }} / {{ data?.articles.length || 0 }} 篇文章
      </p>
    </section>

    <div class="rounded-[1.75rem] p-2">
      <UiCard class="overflow-hidden p-0">
        <div v-if="pending" class="px-6 py-14 text-center text-sm text-[var(--text-secondary)]">
          正在加载文章...
        </div>

        <div v-else-if="!filteredArticles.length" class="px-6 py-14 text-center text-sm text-[var(--text-secondary)]">
          当前筛选条件下没有文章。
        </div>

        <div v-else>
          <UiTable class="min-w-[780px]">
            <UiTableHeader>
              <UiTableRow class="hover:bg-transparent">
                <UiTableHead class="px-6">
                  标题
                </UiTableHead>
                <UiTableHead>状态</UiTableHead>
                <UiTableHead>创建时间</UiTableHead>
                <UiTableHead>更新时间</UiTableHead>
                <UiTableHead class="px-6 text-right">
                  操作
                </UiTableHead>
              </UiTableRow>
            </UiTableHeader>
            <UiTableBody>
              <UiTableRow
                v-for="article in paginatedArticles"
                :key="article.id"
              >
                <UiTableCell class="px-6 py-5">
                  <p class="font-semibold text-[var(--text-primary)]">
                    <span class="inline-flex items-center gap-2">
                      <Icon v-if="article.pinned" name="lucide:pin" class="size-4 text-[var(--primary)]" />
                      <span>{{ article.title }}</span>
                    </span>
                  </p>
                  <p class="mt-1 text-xs text-[var(--text-secondary)]">
                    {{ article.slug }}
                  </p>
                </UiTableCell>
                <UiTableCell class="py-5">
                  <div class="flex flex-wrap gap-2">
                    <UiBadge v-if="article.pinned" variant="secondary">
                      置顶
                    </UiBadge>
                    <UiBadge :variant="article.published ? 'success' : 'warning'">
                      {{ article.published ? '已发布' : '草稿' }}
                    </UiBadge>
                  </div>
                </UiTableCell>
                <UiTableCell class="py-5 text-[var(--text-secondary)]">
                  {{ new Date(article.createdAt).toLocaleDateString() }}
                </UiTableCell>
                <UiTableCell class="py-5 text-[var(--text-secondary)]">
                  {{ new Date(article.updatedAt).toLocaleString() }}
                </UiTableCell>
                <UiTableCell class="px-6 py-5">
                  <div class="flex justify-end gap-2">
                    <UiButton
                      variant="ghost"
                      size="icon"
                      :disabled="togglingPinnedId === article.id"
                      :title="article.pinned ? '取消置顶' : '置顶'"
                      :aria-label="article.pinned ? '取消置顶' : '置顶'"
                      :class="article.pinned ? 'bg-[var(--primary-soft)] text-[var(--primary)]' : ''"
                      @click="togglePinned(article)"
                    >
                      <Icon name="lucide:pin" class="size-4" />
                    </UiButton>
                    <NuxtLink :to="`/admin/articles/${article.id}`">
                      <UiButton variant="secondary" size="sm">
                        编辑
                      </UiButton>
                    </NuxtLink>
                    <UiButton
                      as="NuxtLink"
                      :to="getArticlePreviewTarget(article)"
                      target="_blank"
                      variant="outline"
                      size="sm"
                    >
                      <Icon name="lucide:external-link" class="size-4" />
                      查看前台
                    </UiButton>
                  </div>
                </UiTableCell>
              </UiTableRow>
            </UiTableBody>
          </UiTable>

          <div class="flex flex-col gap-3 border-t border-[var(--border-soft)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p class="text-sm text-[var(--text-secondary)]">
              显示 {{ pageStart }} - {{ pageEnd }} / {{ filteredArticles.length }}
            </p>
            <UiPagination
              :page="currentPage"
              :items-per-page="PAGE_SIZE"
              :total="filteredArticles.length"
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
    </div>
  </div>
</template>
