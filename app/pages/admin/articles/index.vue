<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import type { TableColumn } from '@/components/ui/table'
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
const togglingPublishedId = ref('')
const { showSuccessToast, showErrorToast } = useAdminToast()
const statusFilters = [
  { value: 'all', label: '全部' },
  { value: 'published', label: '已发布' },
  { value: 'draft', label: '草稿' },
] as const
const articleColumns = [
  { prop: 'id', label: 'ID', width: 304, cellClass: 'py-4' },
  { prop: 'article', label: '文章', minWidth: 360, headerClass: 'px-5', cellClass: 'px-5 py-4' },
  { prop: 'status', label: '状态', width: 160, cellClass: 'py-4' },
  { prop: 'viewCount', label: '浏览', width: 96, align: 'right', cellClass: 'py-4 font-medium tabular-nums text-[var(--text-secondary)]', formatter: (_item, _column, value) => Number(value).toLocaleString() },
  { prop: 'updatedAt', label: '更新于', width: 144, cellClass: 'py-4 text-xs text-[var(--text-secondary)]', formatter: (_item, _column, value) => formatArticleDate(String(value)) },
  { prop: 'actions', label: '操作', width: 152, align: 'right', headerClass: 'px-5', cellClass: 'px-5 py-4' },
] satisfies readonly TableColumn[]

const searchText = computed(() => typeof route.query.search === 'string' ? route.query.search : '')
const searchInput = ref('')
const status = computed<'all' | 'published' | 'draft'>({
  get() {
    const value = typeof route.query.status === 'string' ? route.query.status : 'all'
    return value === 'published' || value === 'draft' ? value : 'all'
  },
  set(value) {
    void setStatus(value)
  },
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

async function togglePublished(article: ManagedArticleSummary) {
  const nextPublished = !article.published
  togglingPublishedId.value = article.id

  try {
    await $fetch(`/api/admin/articles/${article.id}/published`, {
      method: 'PUT',
      body: {
        published: nextPublished,
      },
    })
    await refresh()
    showSuccessToast(nextPublished ? '文章已上架' : '文章已下架', article.title)
  } catch (err) {
    showErrorToast('发布状态更新失败', getRequestErrorMessage(err, '发布状态更新失败'))
  } finally {
    togglingPublishedId.value = ''
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
    <AdminPageHeader title="文章管理" subtitle="搜索、筛选与发布状态" :actions="headerActions" />

    <UiCard class="overflow-hidden">
      <UiAlert v-if="data?.configMissing" variant="warning" class="rounded-none border-x-0 border-t-0">
        <Icon name="lucide:database-zap" class="size-4" />
        <UiAlertTitle>数据库未配置</UiAlertTitle>
        <UiAlertDescription>`DATABASE_URL` 未配置，当前无法读取数据库文章。</UiAlertDescription>
      </UiAlert>

      <div class="flex flex-col items-stretch gap-3 border-b border-[var(--border-soft)] p-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-5 lg:p-5">
        <div class="flex shrink-0 items-center gap-2">
          <UiLabel for="article-search" class="shrink-0 text-sm font-medium text-[var(--text-secondary)]">
            搜索
          </UiLabel>
          <div class="w-[min(20rem,70vw)]">
            <UiInput
              id="article-search"
              v-model="searchInput"
              type="search"
              placeholder="搜索标题、摘要或路径"
              class="max-w-none"
            />
          </div>
        </div>

        <div class="flex shrink-0 items-center gap-2">
          <UiLabel for="article-status-filter" class="shrink-0 text-sm font-medium text-[var(--text-secondary)]">
            状态
          </UiLabel>
          <UiSelect v-model="status">
            <UiSelectTrigger id="article-status-filter" class="w-[min(120px,60vw)]">
              <UiSelectValue placeholder="全部状态" />
            </UiSelectTrigger>
            <UiSelectContent>
              <UiSelectItem v-for="filter in statusFilters" :key="filter.value" :value="filter.value">
                {{ filter.label }}
              </UiSelectItem>
            </UiSelectContent>
          </UiSelect>
        </div>

        <div class="flex h-9 shrink-0 items-center text-xs text-[var(--text-secondary)]">
          共 <strong class="mx-1 font-semibold tabular-nums text-[var(--text-primary)]">{{ totalArticles }}</strong> 篇
        </div>
      </div>

      <UiTable
        class="min-w-[1160px]"
        :columns="articleColumns"
        :items="paginatedArticles"
        row-key="id"
        :loading="pending"
        loading-text="正在加载文章"
        :error="error?.message || ''"
        empty-text="没有符合条件的文章，请调整搜索词或发布状态"
        pagination
        :page="currentPage"
        :items-per-page="responsePageSize"
        :total="totalArticles"
        @retry="refresh"
        @update:page="goToPage"
      >
          <template #cell-id="{ item: article }">
            <code class="whitespace-nowrap font-mono text-[11px] text-[var(--text-secondary)]">{{ article.id }}</code>
          </template>

          <template #cell-article="{ item: article }">
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
                  <p class="truncate font-semibold text-[var(--text-primary)]" :title="article.title">{{ article.title }}</p>
                </div>
                <p class="mt-1 line-clamp-1 text-xs text-[var(--text-secondary)]" :title="article.summary || article.slug">
                  {{ article.summary || article.slug }}
                </p>
                <p class="mt-1 truncate font-mono text-[10px] text-[var(--text-muted)]" :title="`/${article.slug}`">/{{ article.slug }}</p>
              </div>
            </div>
          </template>

          <template #cell-status="{ item: article }">
            <div class="flex flex-wrap items-center gap-1.5">
              <UiBadge :variant="article.published ? 'success' : 'warning'" class="gap-1.5 whitespace-nowrap normal-case tracking-[0]">
                <span class="size-1.5 shrink-0 rounded-full bg-current" />
                {{ article.published ? '已发布' : '草稿' }}
              </UiBadge>
              <UiBadge v-if="article.pinned" variant="outline" class="gap-1 whitespace-nowrap px-2 py-1 text-xs font-medium normal-case tracking-[0]">
                置顶
              </UiBadge>
            </div>
          </template>

          <template #cell-actions="{ item: article }">
            <div class="flex justify-end gap-1">
              <NuxtLink v-slot="{ navigate, href }" :to="`/admin/articles/${article.id}`" custom>
                <UiTooltip>
                  <UiTooltipTrigger as-child>
                    <UiButton
                      as="a"
                      :href="href"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="编辑文章"
                      @click="navigate"
                    >
                      <Icon name="lucide:pencil" class="size-4" />
                    </UiButton>
                  </UiTooltipTrigger>
                  <UiTooltipContent>编辑文章</UiTooltipContent>
                </UiTooltip>
              </NuxtLink>

              <UiTooltip>
                <UiTooltipTrigger as-child>
                  <UiButton
                    as="a"
                    :href="getArticlePreviewHref(article)"
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="查看前台"
                  >
                    <Icon name="lucide:external-link" class="size-4" />
                  </UiButton>
                </UiTooltipTrigger>
                <UiTooltipContent>查看前台</UiTooltipContent>
              </UiTooltip>

              <UiDropdownMenu>
                <UiTooltip>
                  <UiTooltipTrigger as-child>
                    <UiDropdownMenuTrigger as-child>
                      <UiButton variant="ghost" size="icon-sm" aria-label="更多文章操作">
                        <Icon name="lucide:ellipsis" class="size-4" />
                      </UiButton>
                    </UiDropdownMenuTrigger>
                  </UiTooltipTrigger>
                  <UiTooltipContent>更多操作</UiTooltipContent>
                </UiTooltip>
                <UiDropdownMenuContent align="end">
                  <UiDropdownMenuItem
                    :disabled="togglingPublishedId === article.id"
                    @select="togglePublished(article)"
                  >
                    <Icon
                      :name="togglingPublishedId === article.id
                        ? 'lucide:loader-circle'
                        : article.published
                          ? 'lucide:arrow-down-to-line'
                          : 'lucide:arrow-up-to-line'"
                      :class="togglingPublishedId === article.id ? 'animate-spin' : ''"
                    />
                    {{ article.published ? '下架文章' : '上架文章' }}
                  </UiDropdownMenuItem>
                  <UiDropdownMenuItem
                    :disabled="togglingPinnedId === article.id"
                    @select="togglePinned(article)"
                  >
                    <Icon :name="togglingPinnedId === article.id ? 'lucide:loader-circle' : 'lucide:pin'" :class="togglingPinnedId === article.id ? 'animate-spin' : ''" />
                    {{ article.pinned ? '取消置顶' : '置顶文章' }}
                  </UiDropdownMenuItem>
                </UiDropdownMenuContent>
              </UiDropdownMenu>
            </div>
          </template>
      </UiTable>
    </UiCard>
  </div>
</template>
