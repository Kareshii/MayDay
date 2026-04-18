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

const { data, pending, refresh, error } = await useFetch<{ configMissing?: boolean; articles: ManagedArticleSummary[] }>('/api/admin/articles')

const searchText = computed(() => typeof route.query.search === 'string' ? route.query.search : '')
const status = computed<'all' | 'published' | 'draft'>(() => {
  const value = typeof route.query.status === 'string' ? route.query.status : 'all'
  return value === 'published' || value === 'draft' ? value : 'all'
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

async function setStatus(nextStatus: 'all' | 'published' | 'draft') {
  if (status.value === nextStatus) {
    return
  }

  const query: Record<string, string> = {}
  const keyword = searchText.value.trim()

  if (keyword) {
    query.search = keyword
  }

  if (nextStatus !== 'all') {
    query.status = nextStatus
  }

  await router.replace({ query })
}
</script>

<template>
  <div class="cms-page space-y-7">
    <section class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 class="cms-page-title">
          文章管理
        </h1>
        <p class="cms-page-subtitle">
          管理和审查所有已发布及草稿内容。
        </p>
      </div>

      <div class="flex flex-wrap gap-3">
        <UiButton variant="outline" @click="refresh">
          <Icon name="lucide:refresh-cw" class="size-4" />
          刷新
        </UiButton>
        <NuxtLink to="/admin/articles/new">
          <UiButton>
            <Icon name="lucide:plus" class="size-4" />
            新建文章
          </UiButton>
        </NuxtLink>
      </div>
    </section>

    <div v-if="error" class="rounded-2xl border border-red-300 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/12 dark:text-red-200">
      {{ error.message }}
    </div>

    <div v-if="data?.configMissing" class="rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/12 dark:text-amber-200">
      `DATABASE_URL` 未配置，当前无法读取数据库文章。
    </div>

    <section class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-wrap gap-2">
        <UiButton
          v-for="value in ['all', 'published', 'draft'] as const"
          :key="value"
          :variant="status === value ? 'default' : 'secondary'"
          size="sm"
          @click="setStatus(value)"
        >
          {{ value === 'all' ? '全部' : value === 'published' ? '已发布' : '草稿' }}
        </UiButton>
      </div>

      <p class="text-sm text-[var(--text-secondary)]">
        {{ filteredArticles.length }} / {{ data?.articles.length || 0 }} 篇文章
      </p>
    </section>

    <div class="rounded-[1.75rem] border border-[var(--border-soft)] bg-[var(--surface-low)] p-2">
      <UiCard class="overflow-hidden p-0">
        <div v-if="pending" class="px-6 py-14 text-center text-sm text-[var(--text-secondary)]">
          正在加载文章...
        </div>

        <div v-else-if="!filteredArticles.length" class="px-6 py-14 text-center text-sm text-[var(--text-secondary)]">
          当前筛选条件下没有文章。
        </div>

        <div v-else>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[780px] text-left text-sm">
              <thead class="bg-[var(--surface-low)] text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                <tr>
                  <th class="px-6 py-4">标题</th>
                  <th class="px-4 py-4">状态</th>
                  <th class="px-4 py-4">创建时间</th>
                  <th class="px-4 py-4">更新时间</th>
                  <th class="px-6 py-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="article in paginatedArticles"
                  :key="article.id"
                  class="transition hover:bg-[var(--surface-high)]"
                >
                  <td class="px-6 py-5 align-top">
                    <p class="font-semibold text-[var(--text-primary)]">
                      {{ article.title }}
                    </p>
                    <p class="mt-1 text-xs text-[var(--text-secondary)]">
                      /detail/{{ article.slug }}
                    </p>
                  </td>
                  <td class="px-4 py-5 align-top">
                    <UiBadge :variant="article.published ? 'success' : 'warning'">
                      {{ article.published ? '已发布' : '草稿' }}
                    </UiBadge>
                  </td>
                  <td class="px-4 py-5 align-top text-[var(--text-secondary)]">
                    {{ new Date(article.createdAt).toLocaleDateString() }}
                  </td>
                  <td class="px-4 py-5 align-top text-[var(--text-secondary)]">
                    {{ new Date(article.updatedAt).toLocaleString() }}
                  </td>
                  <td class="px-6 py-5 align-top">
                    <div class="flex justify-end gap-2">
                      <NuxtLink :to="`/admin/articles/${article.id}`">
                        <UiButton variant="secondary" size="sm">
                          编辑
                        </UiButton>
                      </NuxtLink>
                      <NuxtLink
                        :to="article.published
                          ? { name: 'detail-slug', params: { slug: article.slug } }
                          : { name: 'detail-slug', params: { slug: article.slug }, query: { preview: '1' } }"
                        target="_blank"
                      >
                        <UiButton variant="ghost" size="sm">
                          查看
                        </UiButton>
                      </NuxtLink>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex flex-col gap-3 border-t border-[var(--border-soft)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p class="text-sm text-[var(--text-secondary)]">
              显示 {{ pageStart }} - {{ pageEnd }} / {{ filteredArticles.length }}
            </p>
            <div class="flex items-center gap-2">
              <UiButton
                variant="secondary"
                size="sm"
                :disabled="currentPage <= 1"
                @click="goToPage(currentPage - 1)"
              >
                上一页
              </UiButton>
              <span class="min-w-[5.5rem] text-center text-sm font-medium text-[var(--text-secondary)]">
                {{ currentPage }} / {{ totalPages }}
              </span>
              <UiButton
                variant="secondary"
                size="sm"
                :disabled="currentPage >= totalPages"
                @click="goToPage(currentPage + 1)"
              >
                下一页
              </UiButton>
            </div>
          </div>
        </div>
      </UiCard>
    </div>
  </div>
</template>
