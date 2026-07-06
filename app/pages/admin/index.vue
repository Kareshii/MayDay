<script setup lang="ts">
import type { ManagedArticleSummary } from '~~/shared/types/articles'

definePageMeta({
  layout: 'admin',
})

useSeoMeta({
  title: '后台仪表盘',
  description: '查看文章指标和最近更新。',
})

const { data, pending, error } = await useFetch<{
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

const quickActions = [
  { title: '新建文章', to: '/admin/articles/new', icon: 'lucide:file-plus-2', hint: '创建博客内容' },
  { title: '内容图片', to: '/admin/content-images', icon: 'lucide:image-plus', hint: '上传复用图片' },
  { title: '站点设置', to: '/admin/features/site', icon: 'lucide:sliders-horizontal', hint: '维护站点全局信息' },
  { title: '分类管理', to: '/admin/features/categories', icon: 'lucide:folder-tree', hint: '维护分类结构' },
  { title: '评论管理', to: '/admin/features/comments', icon: 'lucide:message-square', hint: '处理待审评论' },
  { title: '功能管理', to: '/admin/features/tools', icon: 'lucide:search-check', hint: 'SEO 工具与友链' },
]

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

    <div v-if="data?.configMissing" class="rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/12 dark:text-amber-200">
      `DATABASE_URL` 还没有配置，所以后台目前只显示空态。把 PostgreSQL 连接串写进项目环境变量后再刷新。
    </div>

    <!-- 统一核心指标栏 -->
    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
    </div>

    <!-- 左主右从分栏 -->
    <div class="grid gap-6 xl:grid-cols-[1fr_320px] items-start">
      
      <!-- 左侧内容区 -->
      <div class="space-y-6 overflow-hidden">
        <UiCard class="p-6 transition-all duration-300">
          <div class="mb-6 flex items-start justify-between gap-4">
            <div>
              <p class="text-lg font-bold tracking-tight text-[var(--text-primary)]">
                流量来源洞察
              </p>
              <p class="mt-1 text-xs text-[var(--text-secondary)]">
                以最近文章发布量模拟趋势条形图
              </p>
            </div>
            <UiBadge variant="secondary">
              最近 6 个月
            </UiBadge>
          </div>

          <div v-if="pending" class="grid h-64 place-items-center text-sm text-[var(--text-secondary)]">
            正在加载图表...
          </div>

          <AdminTrendChart v-else :data="data?.byMonth || []" />
        </UiCard>

        <UiCard class="p-0 overflow-hidden transition-all duration-300">
          <div class="flex items-center justify-between border-b border-[var(--border-soft)] bg-[var(--surface-low)] px-6 py-4">
            <div>
              <p class="text-base font-bold text-[var(--text-primary)]">
                最近文章
              </p>
              <p class="mt-0.5 text-xs text-[var(--text-secondary)]">
                您最近编辑的内容动态
              </p>
            </div>
            <NuxtLink to="/admin/articles">
              <UiButton variant="secondary" size="sm">
                全部文章
              </UiButton>
            </NuxtLink>
          </div>

          <div v-if="pending" class="px-6 py-12 text-center text-sm text-[var(--text-secondary)]">
            正在加载文章...
          </div>

          <div v-else>
            <UiTable v-if="(data?.recentArticles || []).length" class="w-full">
              <UiTableHeader>
                <UiTableRow class="hover:bg-transparent">
                  <UiTableHead class="px-6">标题</UiTableHead>
                  <UiTableHead class="w-[6rem]">状态</UiTableHead>
                  <UiTableHead class="w-[10rem]">更新时间</UiTableHead>
                  <UiTableHead class="w-[4rem] px-6 text-right">操作</UiTableHead>
                </UiTableRow>
              </UiTableHeader>
              <UiTableBody>
                <UiTableRow
                  v-for="article in data?.recentArticles || []"
                  :key="article.id"
                >
                  <UiTableCell class="px-6">
                  <p class="inline-flex items-center gap-2 font-semibold text-[var(--text-primary)]">
                    <Icon v-if="article.pinned" name="lucide:pin" class="size-4 text-[var(--primary)]" />
                    <span>{{ article.title }}</span>
                  </p>
                    <p class="mt-1 text-xs text-[var(--text-secondary)] line-clamp-1">
                      {{ article.slug }}
                    </p>
                  </UiTableCell>
                  <UiTableCell>
                    <UiBadge :variant="article.published ? 'success' : 'warning'">
                      {{ article.published ? '已发布' : '草稿' }}
                    </UiBadge>
                  </UiTableCell>
                  <UiTableCell class="text-xs text-[var(--text-secondary)]">
                    {{ new Date(article.updatedAt).toLocaleDateString() }}
                  </UiTableCell>
                  <UiTableCell class="px-6">
                    <div class="flex justify-end">
                      <NuxtLink :to="`/admin/articles/${article.id}`">
                        <UiButton variant="ghost" size="sm" class="text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30">
                          编辑
                        </UiButton>
                      </NuxtLink>
                    </div>
                  </UiTableCell>
                </UiTableRow>
              </UiTableBody>
            </UiTable>

            <div v-else class="px-6 py-12 text-center text-sm text-[var(--text-secondary)]">
              暂无内容记录
            </div>
          </div>
        </UiCard>
      </div>

      <!-- 右侧辅助侧边栏 -->
      <div class="space-y-6">
        <UiCard class="p-5">
          <div class="mb-4">
            <p class="text-base font-bold tracking-tight text-[var(--text-primary)]">
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
              class="group flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-[var(--surface-hover)]"
            >
              <span class="flex size-8 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--surface-low)] text-[var(--text-secondary)] group-hover:bg-[var(--primary)] group-hover:text-white transition-colors">
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
              <p class="text-base font-bold tracking-tight text-[var(--text-primary)]">
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
              <span class="font-mono text-green-500">已连接</span>
            </div>
            <p class="border-t border-[var(--border-soft)] pt-3 text-xs leading-relaxed">
              功能总览和待办缺口清单，请直接参阅源码中的 <span class="font-semibold text-[var(--text-primary)]">admin.md</span>。
            </p>
          </div>
        </UiCard>
      </div>
    </div>
  </div>
</template>
