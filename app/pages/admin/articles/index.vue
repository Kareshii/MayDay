<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import type { AdminArticleListResponse, ManagedArticleSummary } from '~~/shared/types/articles'

definePageMeta({
  layout: 'admin',
})

useSeoMeta({
  title: '文章管理',
  description: '搜索并管理 PostgreSQL 中的文章。',
})

const route = useRoute()
const router = useRouter()
const PAGE_SIZE = 20
const togglingPinnedId = ref('')
const { showSuccessToast, showErrorToast } = useAdminToast()
const statusFilters = [
  { value: 'all', label: '全部', icon: 'lucide:files' },
  { value: 'published', label: '已发布', icon: 'lucide:circle-check' },
  { value: 'draft', label: '草稿', icon: 'lucide:file-pen-line' },
] as const

const searchText = computed(() => typeof route.query.search === 'string' ? route.query.search : '')
const searchInput = ref('')
const status = computed<'all' | 'published' | 'draft'>(() => {
  const value = typeof route.query.status === 'string' ? route.query.status : 'all'
  return value === 'published' || value === 'draft' ? value : 'all'
})
const requestedPage = computed(() => {
  const value = typeof route.query.page === 'string'
    ? Number.parseInt(route.query.page, 10)
    : 1

  return Number.isFinite(value) && value > 0 ? value : 1
})
const articleListQuery = computed(() => ({
  page: requestedPage.value,
  page_size: PAGE_SIZE,
  search: searchText.value.trim() || undefined,
  status: status.value === 'all' ? undefined : status.value,
}))

const { data, pending, error, refresh } = await useFetch<AdminArticleListResponse>('/api/admin/articles', {
  query: articleListQuery,
})
const headerActions = computed(() => [
  {
    label: '新建文章',
    icon: 'lucide:plus',
    to: '/admin/articles/new',
  },
])

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

const applySearch = useDebounceFn(async (value: string) => {
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
}, 250, { maxWait: 700 })

watch(searchInput, (value) => {
  void applySearch(value)
})

const filteredArticles = computed(() => data.value?.articles || [])
const totalArticles = computed(() => data.value?.total || 0)
const responsePageSize = computed(() => data.value?.page_size || PAGE_SIZE)

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(totalArticles.value / responsePageSize.value))
})

const currentPage = computed(() => {
  const responsePage = data.value?.page

  if (typeof responsePage !== 'number' || !Number.isFinite(responsePage)) {
    return requestedPage.value
  }

  return Math.min(Math.max(1, responsePage), totalPages.value)
})

const paginatedArticles = computed(() => filteredArticles.value)
const pagePublishedCount = computed(() => filteredArticles.value.filter(article => article.published).length)
const pageDraftCount = computed(() => filteredArticles.value.length - pagePublishedCount.value)
const pagePinnedCount = computed(() => filteredArticles.value.filter(article => article.pinned).length)

const pageStart = computed(() => {
  if (!totalArticles.value || !filteredArticles.value.length) {
    return 0
  }

  return (currentPage.value - 1) * responsePageSize.value + 1
})

const pageEnd = computed(() => {
  if (!pageStart.value) {
    return 0
  }

  return Math.min(pageStart.value + filteredArticles.value.length - 1, totalArticles.value)
})

function buildPageQuery(nextPage: number) {
  const query: Record<string, string> = {}
  const keyword = searchInput.value.trim()

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

async function setStatus(nextStatus: 'all' | 'published' | 'draft') {
  if (nextStatus === status.value) {
    return
  }

  const query: Record<string, string> = {}
  const keyword = searchInput.value.trim()

  if (keyword) {
    query.search = keyword
  }

  if (nextStatus !== 'all') {
    query.status = nextStatus
  }

  await router.replace({ query })
}

function formatArticleDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

function getArticlePreviewTarget(article: ManagedArticleSummary) {
  return article.published
    ? { name: 'detail-slug', params: { slug: article.slug } }
    : { name: 'detail-slug', params: { slug: article.slug }, query: { preview: '1' } }
}

function getArticlePreviewHref(article: ManagedArticleSummary) {
  return router.resolve(getArticlePreviewTarget(article)).href
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
  <div class="cms-page space-y-4">
    <AdminPageHeader title="文章管理" subtitle="搜索、筛选与发布状态" :actions="headerActions" :search="headerSearch" />

    <div v-if="data?.configMissing" class="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
      <Icon name="lucide:database-zap" class="mt-0.5 size-4 shrink-0" />
      <span>`DATABASE_URL` 未配置，当前无法读取数据库文章。</span>
    </div>

    <section class="flex flex-col gap-3 border-b border-[var(--border-soft)] pb-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex min-w-0 gap-1 overflow-x-auto">
        <button
          v-for="filter in statusFilters"
          :key="filter.value"
          type="button"
          class="inline-flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
          :class="status === filter.value
            ? 'bg-[var(--surface-high)] text-[var(--text-primary)]'
            : 'text-[var(--text-secondary)] hover:bg-[var(--surface-low)] hover:text-[var(--text-primary)]'"
          :aria-pressed="status === filter.value"
          @click="setStatus(filter.value)"
        >
          <Icon :name="filter.icon" class="size-4" />
          {{ filter.label }}
        </button>
      </div>

      <div class="flex shrink-0 items-center gap-3 text-xs text-[var(--text-secondary)]">
        <span>共 <strong class="font-semibold tabular-nums text-[var(--text-primary)]">{{ totalArticles }}</strong> 篇</span>
        <span class="h-3 w-px bg-[var(--border-strong)]" />
        <span>每页 {{ responsePageSize }}</span>
      </div>
    </section>

    <section class="overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--surface-card)]">
      <header class="flex min-h-16 items-center justify-between gap-4 border-b border-[var(--border-soft)] px-5 py-3.5">
        <div class="flex min-w-0 items-center gap-3">
          <span class="grid size-8 shrink-0 place-items-center rounded-md bg-[var(--surface-high)] text-[var(--text-secondary)]">
            <Icon name="lucide:table-2" class="size-4" />
          </span>
          <div class="min-w-0">
            <h2 class="text-sm font-semibold text-[var(--text-primary)]">文章列表</h2>
            <p class="mt-0.5 truncate text-xs text-[var(--text-secondary)]">
              第 {{ currentPage }} / {{ totalPages }} 页
            </p>
          </div>
        </div>
        <div class="hidden items-center gap-3 text-xs text-[var(--text-secondary)] sm:flex">
          <span>本页发布 {{ pagePublishedCount }}</span>
          <span>草稿 {{ pageDraftCount }}</span>
          <span>置顶 {{ pagePinnedCount }}</span>
        </div>
      </header>

      <div v-if="pending" class="flex min-h-64 items-center justify-center">
        <div class="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
          <Icon name="lucide:loader-circle" class="size-4 animate-spin text-[var(--primary)]" />
          正在加载文章
        </div>
      </div>

      <div v-else-if="!filteredArticles.length" class="px-5 py-16 text-center">
        <span class="mx-auto grid size-12 place-items-center rounded-md bg-[var(--surface-high)] text-[var(--text-muted)]">
          <Icon name="lucide:file-search" class="size-5" />
        </span>
        <p class="mt-4 text-sm font-semibold text-[var(--text-primary)]">没有符合条件的文章</p>
        <p class="mt-1 text-xs text-[var(--text-secondary)]">调整搜索词或发布状态</p>
      </div>

      <template v-else>
        <UiTable class="min-w-[880px]">
          <UiTableHeader>
            <UiTableRow class="hover:bg-transparent">
              <UiTableHead class="px-5">文章</UiTableHead>
              <UiTableHead class="w-[10rem]">状态</UiTableHead>
              <UiTableHead class="w-[6rem] text-right">浏览</UiTableHead>
              <UiTableHead class="w-[9rem]">更新于</UiTableHead>
              <UiTableHead class="w-[9rem] px-5 text-right">操作</UiTableHead>
            </UiTableRow>
          </UiTableHeader>
          <UiTableBody>
            <UiTableRow v-for="article in paginatedArticles" :key="article.id">
              <UiTableCell class="px-5 py-4">
                <div class="grid grid-cols-[4.75rem_minmax(0,1fr)] items-center gap-4">
                  <div class="aspect-[4/3] overflow-hidden rounded-md border border-[var(--border-soft)] bg-[var(--surface-low)]">
                    <img v-if="article.coverImage" :src="article.coverImage" :alt="article.title" class="size-full object-cover" loading="lazy">
                    <div v-else class="grid size-full place-items-center text-[var(--text-muted)]">
                      <Icon name="lucide:image" class="size-4" />
                    </div>
                  </div>
                  <div class="min-w-0">
                    <div class="flex min-w-0 items-center gap-2">
                      <Icon v-if="article.pinned" name="lucide:pin" class="size-3.5 shrink-0 text-[var(--primary)]" />
                      <p class="truncate font-semibold text-[var(--text-primary)]">{{ article.title }}</p>
                    </div>
                    <p class="mt-1 line-clamp-1 text-xs text-[var(--text-secondary)]">
                      {{ article.summary || article.slug }}
                    </p>
                    <p class="mt-1 truncate font-mono text-[10px] text-[var(--text-muted)]">/{{ article.slug }}</p>
                  </div>
                </div>
              </UiTableCell>

              <UiTableCell class="py-4">
                <div class="flex flex-wrap items-center gap-1.5">
                  <UiBadge
                    variant="outline"
                    :class="[
                      'gap-1.5 whitespace-nowrap px-2 py-1 text-xs font-medium normal-case tracking-[0]',
                      article.published
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300'
                        : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300',
                    ]"
                  >
                    <span class="size-1.5 shrink-0 rounded-full bg-current" />
                    {{ article.published ? '已发布' : '草稿' }}
                  </UiBadge>
                  <UiBadge v-if="article.pinned" variant="outline" class="gap-1 whitespace-nowrap px-2 py-1 text-xs font-medium normal-case tracking-[0]">
                    置顶
                  </UiBadge>
                </div>
              </UiTableCell>

              <UiTableCell class="py-4 text-right font-medium tabular-nums text-[var(--text-secondary)]">
                {{ article.viewCount.toLocaleString() }}
              </UiTableCell>

              <UiTableCell class="py-4 text-xs text-[var(--text-secondary)]">
                {{ formatArticleDate(article.updatedAt) }}
              </UiTableCell>

              <UiTableCell class="px-5 py-4">
                <div class="flex justify-end gap-1">
                  <UiButton
                    variant="ghost"
                    size="icon"
                    class="size-8"
                    :disabled="togglingPinnedId === article.id"
                    :title="article.pinned ? '取消置顶' : '置顶'"
                    :aria-label="article.pinned ? '取消置顶' : '置顶'"
                    :class="article.pinned ? 'bg-[var(--primary-soft)] text-[var(--primary)]' : 'text-[var(--text-secondary)]'"
                    @click="togglePinned(article)"
                  >
                    <Icon :name="togglingPinnedId === article.id ? 'lucide:loader-circle' : 'lucide:pin'" :class="['size-4', togglingPinnedId === article.id ? 'animate-spin' : '']" />
                  </UiButton>
                  <NuxtLink :to="`/admin/articles/${article.id}`" custom v-slot="{ navigate, href }">
                    <UiButton
                      as="a"
                      :href="href"
                      variant="ghost"
                      size="icon"
                      class="size-8 text-[var(--text-secondary)]"
                      title="编辑文章"
                      aria-label="编辑文章"
                      @click="navigate"
                    >
                      <Icon name="lucide:pencil" class="size-4" />
                    </UiButton>
                  </NuxtLink>
                  <UiButton
                    as="a"
                    :href="getArticlePreviewHref(article)"
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="ghost"
                    size="icon"
                    class="size-8 text-[var(--text-secondary)]"
                    title="查看前台"
                    aria-label="查看前台"
                  >
                    <Icon name="lucide:external-link" class="size-4" />
                  </UiButton>
                </div>
              </UiTableCell>
            </UiTableRow>
          </UiTableBody>
        </UiTable>

        <div class="flex flex-col gap-3 border-t border-[var(--border-soft)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p class="text-xs text-[var(--text-secondary)]">
            显示 <span class="font-medium tabular-nums text-[var(--text-primary)]">{{ pageStart }} - {{ pageEnd }}</span> / {{ totalArticles }}
          </p>
          <UiPagination
            :page="currentPage"
            :items-per-page="responsePageSize"
            :total="totalArticles"
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
      </template>
    </section>
  </div>
</template>
