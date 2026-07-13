<script setup lang="ts">
import type { TableColumn } from '@/components/ui/table'
import type { ManagedArticleSummary } from '~~/shared/types/articles'

definePageMeta({
  layout: 'admin',
})

useSeoMeta({
  title: '后台仪表盘',
  description: '查看文章指标和最近更新。',
})

const { data, pending, error, refresh } = await useFetch<{
  configMissing?: boolean
  stats: {
    total: number
    published: number
    drafts: number
    pinned: number
    latestUpdatedAt: string | null
  }
  byMonth: { label: string; value: number }[]
  recentArticles: ManagedArticleSummary[]
  extensionStats: {
    categories: number
    comments: number
    pendingComments: number
    images: number
    imageStorageSize: number
  }
}>('/api/admin/dashboard')
const { showErrorToast } = useAdminToast()

const packageVersion = '2.0.0'
const RECENT_PAGE_SIZE = 5
const recentSearch = ref('')
const recentStatus = ref<'all' | 'published' | 'draft'>('all')
const recentPage = ref(1)

const quickActions = [
  { title: '新建文章', to: '/admin/articles/new', icon: 'lucide:file-plus-2', hint: '创建博客内容' },
  { title: '内容图片', to: '/admin/content-images', icon: 'lucide:image-plus', hint: '上传复用图片' },
  { title: '图册管理', to: '/admin/gallery', icon: 'lucide:images', hint: '维护首页图册' },
  { title: '站点设置', to: '/admin/features/site', icon: 'lucide:sliders-horizontal', hint: '维护站点全局信息' },
  { title: '分类管理', to: '/admin/features/categories', icon: 'lucide:folder-tree', hint: '维护分类结构' },
  { title: '评论管理', to: '/admin/features/comments', icon: 'lucide:message-square', hint: '处理待审评论' },
  { title: '功能管理', to: '/admin/features/tools', icon: 'lucide:search-check', hint: 'SEO 工具与友链' },
]
const recentArticleColumns = [
  { prop: 'title', label: '标题', minWidth: 280, headerClass: 'px-6', cellClass: 'px-6' },
  { prop: 'status', label: '状态', width: 96 },
  { prop: 'updatedAt', label: '更新时间', width: 160, cellClass: 'text-xs text-[var(--text-secondary)]', formatter: (_item, _column, value) => new Date(String(value)).toLocaleDateString() },
  { prop: 'actions', label: '操作', width: 96, align: 'right', headerClass: 'px-6', cellClass: 'px-6' },
] satisfies readonly TableColumn[]

const recentArticles = computed(() => data.value?.recentArticles || [])
const filteredRecentArticles = computed(() => {
  const keyword = recentSearch.value.trim().toLocaleLowerCase('zh-CN')

  return recentArticles.value.filter((article) => {
    if (recentStatus.value === 'published' && !article.published) {
      return false
    }

    if (recentStatus.value === 'draft' && article.published) {
      return false
    }

    if (!keyword) {
      return true
    }

    return [article.title, article.summary, article.slug]
      .join(' ')
      .toLocaleLowerCase('zh-CN')
      .includes(keyword)
  })
})
const recentTotalPages = computed(() => Math.max(1, Math.ceil(filteredRecentArticles.value.length / RECENT_PAGE_SIZE)))
const paginatedRecentArticles = computed(() => {
  const start = (recentPage.value - 1) * RECENT_PAGE_SIZE
  return filteredRecentArticles.value.slice(start, start + RECENT_PAGE_SIZE)
})

watch([recentSearch, recentStatus], () => {
  recentPage.value = 1
})

watch(recentTotalPages, (value) => {
  recentPage.value = Math.min(recentPage.value, value)
})

function goToRecentPage(nextPage: number) {
  recentPage.value = Math.min(Math.max(1, nextPage), recentTotalPages.value)
}

function formatSize(size = 0) {
  if (size < 1024) {
    return `${size} B`
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

watch(error, (value) => {
  if (value) {
    showErrorToast('仪表盘加载失败', value.message)
  }
}, { immediate: true })
</script>

<template>
  <div class="cms-page space-y-6">
    <AdminPageHeader title="仪表板概览" subtitle="" />

    <UiAlert v-if="error" variant="destructive">
      <Icon name="lucide:circle-alert" />
      <UiAlertTitle>仪表盘加载失败</UiAlertTitle>
      <UiAlertDescription>{{ error.message }}</UiAlertDescription>
      <UiAlertAction>
        <UiButton variant="outline" size="sm" @click="refresh">
          <Icon name="lucide:refresh-cw" class="size-4" />
          重试
        </UiButton>
      </UiAlertAction>
    </UiAlert>

    <UiAlert v-else-if="data?.configMissing" variant="warning">
      <Icon name="lucide:database-zap" />
      <UiAlertTitle>数据库尚未配置</UiAlertTitle>
      <UiAlertDescription>
        `DATABASE_URL` 还没有配置，所以后台目前只显示空态。把 PostgreSQL 连接串写进项目环境变量后再刷新。
      </UiAlertDescription>
    </UiAlert>

    <template v-if="!error">
    <!-- 统一核心指标栏 -->
    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <template v-if="pending">
        <UiSkeleton v-for="index in 4" :key="index" class="h-32" />
      </template>
      <template v-else>
        <AdminMetricCard
          label="文章库"
          :value="data?.stats.total || 0"
          :hint="`${data?.stats.published || 0} 已发布 · ${data?.stats.drafts || 0} 草稿`"
          icon="lucide:file-text"
        />
        <AdminMetricCard
          label="分类架构"
          :value="data?.extensionStats.categories || 0"
          hint="后台维护的主题分类"
          icon="lucide:folder-tree"
        />
        <AdminMetricCard
          label="读者互动"
          :value="data?.extensionStats.comments || 0"
          :hint="`${data?.extensionStats.pendingComments || 0} 条待审核评论`"
          icon="lucide:message-square"
        />
        <AdminMetricCard
          label="媒体资产"
          :value="data?.extensionStats.images || 0"
          :hint="`已占用容量 ${formatSize(data?.extensionStats.imageStorageSize || 0)}`"
          icon="lucide:image"
        />
      </template>
    </div>

    <!-- 左主右从分栏 -->
    <div class="grid gap-6 xl:grid-cols-[1fr_320px] items-start">
      
      <!-- 左侧内容区 -->
      <div class="space-y-6 overflow-hidden">
        <UiCard class="p-6">
          <div class="mb-6 flex items-start justify-between gap-4">
            <div>
              <p class="text-lg font-bold text-[var(--text-primary)]">
                内容更新分布
              </p>
              <p class="mt-1 text-xs text-[var(--text-secondary)]">
                最近 6 个月文章发布量
              </p>
            </div>
            <UiBadge variant="secondary">
              最近 6 个月
            </UiBadge>
          </div>

          <UiSkeleton v-if="pending" class="h-64 w-full" />

          <AdminTrendChart v-else :data="data?.byMonth || []" />
        </UiCard>

        <UiCard class="overflow-hidden p-0">
          <div class="flex flex-col items-stretch gap-3 border-b border-[var(--border-soft)] p-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-5 lg:p-5">
            <div class="flex shrink-0 items-center gap-2">
              <UiLabel for="recent-article-search" class="shrink-0 text-sm font-medium text-[var(--text-secondary)]">
                搜索
              </UiLabel>
              <div class="w-[min(12rem,60vw)]">
                <UiInput
                  id="recent-article-search"
                  v-model="recentSearch"
                  type="search"
                  placeholder="搜索最近文章"
                  :disabled="pending"
                />
              </div>
            </div>

            <div class="flex shrink-0 items-center gap-2">
              <UiLabel for="recent-article-status" class="shrink-0 text-sm font-medium text-[var(--text-secondary)]">
                状态
              </UiLabel>
              <UiSelect v-model="recentStatus" :disabled="pending">
                <UiSelectTrigger id="recent-article-status" class="w-[min(120px,60vw)]">
                  <UiSelectValue placeholder="全部状态" />
                </UiSelectTrigger>
                <UiSelectContent>
                  <UiSelectItem value="all">全部状态</UiSelectItem>
                  <UiSelectItem value="published">已发布</UiSelectItem>
                  <UiSelectItem value="draft">草稿</UiSelectItem>
                </UiSelectContent>
              </UiSelect>
            </div>

            <div class="flex h-9 shrink-0 items-center text-xs text-[var(--text-secondary)]">
              共 <strong class="mx-1 font-semibold tabular-nums text-[var(--text-primary)]">{{ filteredRecentArticles.length }}</strong> 篇
            </div>

            <UiButton as="NuxtLink" to="/admin/articles" class="shrink-0" variant="secondary" size="sm">
              全部文章
            </UiButton>
          </div>

          <div v-if="pending" class="space-y-3 p-5" aria-label="正在加载最近文章">
            <UiSkeleton class="h-9 w-full" />
            <UiSkeleton v-for="index in RECENT_PAGE_SIZE" :key="index" class="h-12 w-full" />
          </div>

          <UiTable
            v-else
            class="w-full"
            :columns="recentArticleColumns"
            :items="paginatedRecentArticles"
            row-key="id"
            empty-text="没有符合条件的最近文章"
            pagination
            :page="recentPage"
            :items-per-page="RECENT_PAGE_SIZE"
            :total="filteredRecentArticles.length"
            @update:page="goToRecentPage"
          >
            <template #cell-title="{ item: article }">
                <p class="inline-flex items-center gap-2 font-semibold text-[var(--text-primary)]" :title="article.title">
                  <Icon v-if="article.pinned" name="lucide:pin" class="size-4 text-[var(--primary)]" />
                  <span>{{ article.title }}</span>
                </p>
                <p class="mt-1 line-clamp-1 text-xs text-[var(--text-secondary)]" :title="article.slug">
                  {{ article.slug }}
                </p>
            </template>

            <template #cell-status="{ item: article }">
              <UiBadge :variant="article.published ? 'success' : 'warning'">
                {{ article.published ? '已发布' : '草稿' }}
              </UiBadge>
            </template>

            <template #cell-actions="{ item: article }">
              <div class="flex justify-end">
                <UiButton as="NuxtLink" :to="`/admin/articles/${article.id}`" variant="ghost" size="sm">
                  编辑
                </UiButton>
              </div>
            </template>
          </UiTable>
        </UiCard>
      </div>

      <!-- 右侧辅助侧边栏 -->
      <div class="space-y-6">
        <UiCard class="p-5">
          <div class="mb-4">
            <p class="text-base font-bold text-[var(--text-primary)]">
              快捷操作
            </p>
            <p class="mt-0.5 text-xs text-[var(--text-secondary)]">
              快速直达各个模块
            </p>
          </div>

          <div class="flex flex-col gap-1">
            <NuxtLink
              v-for="action in quickActions"
              :key="action.to"
              :to="action.to"
              class="group flex items-center gap-3 rounded-md p-3 transition-colors hover:bg-[var(--surface-hover)]"
            >
              <span class="flex size-8 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--surface-low)] text-[var(--text-secondary)] transition-colors group-hover:bg-[var(--primary)] group-hover:text-[var(--primary-foreground)]">
                <Icon :name="action.icon" class="size-4" />
              </span>
              <div class="flex-1 overflow-hidden">
                <p class="truncate text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                  {{ action.title }}
                </p>
                <p class="truncate text-xs text-[var(--text-secondary)]">
                  {{ action.hint }}
                </p>
              </div>
            </NuxtLink>
          </div>
        </UiCard>

        <UiCard class="p-5">
          <div class="mb-4 flex items-start justify-between gap-4">
            <div>
            <p class="text-base font-bold text-[var(--text-primary)]">
                系统状态
              </p>
              <p class="mt-0.5 text-xs text-[var(--text-secondary)]">
                版本与运行环境
              </p>
            </div>
            <UiBadge :variant="data?.stats.latestUpdatedAt ? 'success' : 'secondary'">
              {{ data?.stats.latestUpdatedAt ? '运行中' : '空闲' }}
            </UiBadge>
          </div>

          <div class="space-y-3 text-sm text-[var(--text-secondary)]">
            <div class="flex items-center justify-between">
              <span>系统核心版本</span>
              <span class="font-mono text-[var(--text-primary)]">v{{ packageVersion }}</span>
            </div>
            <div class="flex items-center justify-between border-t border-[var(--border-soft)] pt-3">
              <span>PostgreSQL</span>
              <UiBadge variant="success">已连接</UiBadge>
            </div>
            <p class="border-t border-[var(--border-soft)] pt-3 text-xs leading-relaxed">
              功能总览和待办缺口清单，请直接参阅源码中的 <span class="font-semibold text-[var(--text-primary)]">admin.md</span>。
            </p>
          </div>
        </UiCard>
      </div>
    </div>
    </template>
  </div>
</template>
