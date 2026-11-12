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

const latestUpdate = computed(() => data.value?.stats.latestUpdatedAt
  ? new Date(data.value.stats.latestUpdatedAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
  : '暂无更新记录')

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
  <div class="cms-dashboard">
    <AdminPageHeader title="仪表盘概览" />
    <UiAlert v-if="error" variant="destructive" class="mb-6">
      <Icon name="lucide:circle-alert" />
      <UiAlertTitle>仪表盘加载失败</UiAlertTitle>
      <UiAlertDescription>{{ error.message }}</UiAlertDescription>
      <UiAlertAction><UiButton variant="outline" size="sm" @click="refresh">刷新</UiButton></UiAlertAction>
    </UiAlert>
    <UiAlert v-else-if="data?.configMissing" variant="warning" class="mb-6">
      <Icon name="lucide:database-zap" />
      <UiAlertTitle>数据库尚未配置</UiAlertTitle>
      <UiAlertDescription>请在项目环境变量中配置 DATABASE_URL 后刷新。</UiAlertDescription>
    </UiAlert>

    <template v-if="!error">
      <section class="cms-dashboard-stage" aria-label="仪表盘概览">
        <div class="cms-dashboard-hero">
          <span class="cms-glass-chip">Dashboard Overview</span>
          <h1><span><span>记录此刻，</span></span><span><span>继续热爱。</span></span></h1>
          <p class="cms-dashboard-hero__description">在这里整理灵感，记录生活的每一个片刻。<br>从一篇文章开始，让值得分享的故事被看见。</p>
          <p class="cms-dashboard-hero__updated"><AppIcon name="i-clock-3" /> 最近更新 · {{ latestUpdate }}</p>
        </div>

        <div class="cms-dashboard-forecast">
          <div class="cms-dashboard-forecast__heading"><h2>内容增长趋势</h2><span>最近 6 个有内容的月份</span></div>
          <UiSkeleton v-if="pending" class="h-60 w-full" />
          <AdminTrendChart v-else :data="data?.byMonth || []" />
        </div>

        <aside class="cms-dashboard-rail" aria-label="内容数据">
          <template v-if="pending">
            <UiSkeleton v-for="index in 4" :key="index" class="min-h-28 flex-1" />
          </template>
          <template v-else-if="data">
            <NuxtLink to="/admin/articles" class="cms-stat-card cms-stat-card--big">
              <div class="cms-stat-card__heading"><span>文章库</span><AppIcon name="i-file-text" /></div>
              <p class="cms-stat-card__total">{{ data.stats.total }}<i>篇</i></p>
              <div class="cms-stat-card__metrics">
                <span><AppIcon name="i-circle-check" />{{ data.stats.published }} 已发布</span>
                <span><AppIcon name="i-file-pen-line" />{{ data.stats.drafts }} 草稿</span>
                <span><AppIcon name="i-pin" />{{ data.stats.pinned }} 置顶</span>
              </div>
            </NuxtLink>
            <NuxtLink to="/admin/features/categories" class="cms-stat-card cms-stat-card--row">
              <div><span class="cms-stat-card__eyebrow">内容组织</span><h2>分类架构</h2><p>后台维护的主题分类</p></div>
              <div class="cms-stat-card__number">{{ data.extensionStats.categories }}<AppIcon name="i-folder-tree" /></div>
            </NuxtLink>
            <NuxtLink to="/admin/features/comments" class="cms-stat-card cms-stat-card--row">
              <div><span class="cms-stat-card__eyebrow">读者互动</span><h2>评论消息</h2><p>{{ data.extensionStats.pendingComments }} 条待审核评论</p></div>
              <div class="cms-stat-card__number">{{ data.extensionStats.comments }}<AppIcon name="i-message-square" /></div>
            </NuxtLink>
            <NuxtLink to="/admin/content-images" class="cms-stat-card cms-stat-card--row">
              <div><span class="cms-stat-card__eyebrow">媒体资产</span><h2>内容图片</h2><p>已占用 {{ formatSize(data.extensionStats.imageStorageSize) }}</p></div>
              <div class="cms-stat-card__number">{{ data.extensionStats.images }}<AppIcon name="i-images" /></div>
            </NuxtLink>
          </template>
        </aside>
        <a href="#dashboard-content" class="cms-dashboard-more">最近文章与快捷操作 <AppIcon name="i-chevron-down" /></a>
      </section>

      <section id="dashboard-content" class="cms-dashboard-content" aria-label="最近文章与快捷操作">
        <div class="cms-section-heading"><div><span>YOUR WORKSPACE</span><h2>继续你的创作</h2></div><p>每一个想法，都值得被记录。</p></div>
        <div class="cms-quick-actions">
          <NuxtLink v-for="action in quickActions" :key="action.to" :to="action.to" class="cms-quick-action">
            <AppIcon :name="action.icon" /><span>{{ action.title }}</span><AppIcon name="i-chevron-right" />
          </NuxtLink>
        </div>
        <div class="cms-section-heading cms-section-heading--recent"><h2>最近文章</h2><p>查看、整理与继续编辑</p></div>
        <UiCard class="cms-recent-articles overflow-hidden p-0">
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

            <NuxtLink to="/admin/articles" class="shrink-0">
              <UiButton as="span" variant="secondary" size="sm">全部文章</UiButton>
            </NuxtLink>
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
                <NuxtLink :to="`/admin/articles/${article.id}`">
                  <UiButton as="span" variant="ghost" size="sm">编辑</UiButton>
                </NuxtLink>
              </div>
            </template>
          </UiTable>
        </UiCard>
        <div class="cms-dashboard-system"><span>Mayday CMS <span class="font-mono">v{{ packageVersion }}</span></span><span><span class="cms-status-dot" />{{ data?.configMissing ? '数据库未配置' : 'PostgreSQL 已连接' }}</span><span>最近更新 · {{ latestUpdate }}</span></div>
      </section>
    </template>
  </div>
</template>
