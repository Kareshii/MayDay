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

const search = ref(typeof route.query.search === 'string' ? route.query.search : '')
const status = ref(typeof route.query.status === 'string' ? route.query.status : 'all')

const filteredArticles = computed(() => {
  const keyword = search.value.trim().toLowerCase()

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

watch([search, status], async () => {
  const query: Record<string, string> = {}

  if (search.value.trim()) {
    query.search = search.value.trim()
  }

  if (status.value !== 'all') {
    query.status = status.value
  }

  await router.replace({ query })
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p class="section-kicker">BLOG MANAGEMENT</p>
        <h2 class="mt-3 text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
          管理文章
        </h2>
        <p class="mt-2 text-sm text-[var(--text-secondary)]">
          页面结构参考 `blog-next/app/(cms)/admin/blog-management`，但已适配为 Vue/Nuxt。
        </p>
      </div>

      <div class="flex flex-wrap gap-3">
        <UiButton variant="outline" @click="refresh">
          刷新
        </UiButton>
        <NuxtLink to="/admin/articles/new">
          <UiButton>
            新建文章
          </UiButton>
        </NuxtLink>
      </div>
    </div>

    <div v-if="error" class="rounded-2xl border border-red-300 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
      {{ error.message }}
    </div>

    <div v-if="data?.configMissing" class="rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
      `DATABASE_URL` 未配置，当前无法读取数据库文章。
    </div>

    <UiCard class="p-5">
      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <UiInput v-model="search" class="md:max-w-sm" placeholder="按标题、标识或摘要搜索" />

        <div class="flex flex-wrap gap-2">
          <UiButton
            v-for="value in ['all', 'published', 'draft']"
            :key="value"
            :variant="status === value ? 'default' : 'secondary'"
            size="sm"
            @click="status = value"
          >
            {{ value === 'all' ? '全部' : value === 'published' ? '已发布' : '草稿' }}
          </UiButton>
        </div>
      </div>
    </UiCard>

    <UiCard class="overflow-hidden p-0">
      <div v-if="pending" class="px-6 py-12 text-center text-sm text-[var(--text-secondary)]">
        正在加载文章...
      </div>

      <div v-else-if="!filteredArticles.length" class="px-6 py-12 text-center text-sm text-[var(--text-secondary)]">
        当前筛选条件下没有文章。
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-[760px] text-left text-sm">
          <thead class="bg-black/[0.03] text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)] dark:bg-white/[0.04]">
            <tr>
              <th class="px-6 py-4">标题</th>
              <th class="px-6 py-4">状态</th>
              <th class="px-6 py-4">创建时间</th>
              <th class="px-6 py-4">更新时间</th>
              <th class="px-6 py-4 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="article in filteredArticles"
              :key="article.id"
              class="border-t border-[var(--border)]"
            >
              <td class="px-6 py-5">
                <p class="font-medium text-[var(--text-primary)]">
                  {{ article.title }}
                </p>
                <p class="mt-1 text-xs text-[var(--text-secondary)]">
                  /posts/{{ article.slug }}
                </p>
              </td>
              <td class="px-6 py-5">
                <UiBadge :variant="article.published ? 'success' : 'warning'">
                  {{ article.published ? '已发布' : '草稿' }}
                </UiBadge>
              </td>
              <td class="px-6 py-5 text-[var(--text-secondary)]">
                {{ new Date(article.createdAt).toLocaleDateString() }}
              </td>
              <td class="px-6 py-5 text-[var(--text-secondary)]">
                {{ new Date(article.updatedAt).toLocaleString() }}
              </td>
              <td class="px-6 py-5">
                <div class="flex justify-end gap-2">
                  <NuxtLink :to="`/admin/articles/${article.id}`">
                    <UiButton variant="secondary" size="sm">
                      编辑
                    </UiButton>
                  </NuxtLink>
                  <NuxtLink :to="article.published ? `/posts/${article.slug}` : `/posts/${article.slug}?preview=1`" target="_blank">
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
    </UiCard>
  </div>
</template>
