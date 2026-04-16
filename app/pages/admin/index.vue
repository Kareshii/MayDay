<script setup lang="ts">
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
    latestUpdatedAt: string | null
  }
  byMonth: { label: string; value: number }[]
  recentArticles: ManagedArticleSummary[]
}>('/api/admin/dashboard')

const maxMonthValue = computed(() => Math.max(...(data.value?.byMonth.map(item => item.value) || [1])))
</script>

<template>
  <div class="space-y-6">
    <div v-if="error" class="rounded-2xl border border-red-300 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
      {{ error.message }}
    </div>

    <div v-if="data?.configMissing" class="rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
      `DATABASE_URL` 还没有配置，所以后台目前只显示空态。把 PostgreSQL 连接串写进项目环境变量后再刷新。
    </div>

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <AdminMetricCard
        label="文章总数"
        :value="data?.stats.total || 0"
        :hint="pending ? '加载中...' : '数据库中的全部文章'"
        icon="lucide:file-text"
      />
      <AdminMetricCard
        label="已发布"
        :value="data?.stats.published || 0"
        :hint="'会显示在 /posts'"
        icon="lucide:send"
      />
      <AdminMetricCard
        label="草稿"
        :value="data?.stats.drafts || 0"
        :hint="'仅后台可见'"
        icon="lucide:file-clock"
      />
      <AdminMetricCard
        label="最近更新"
        :value="data?.stats.latestUpdatedAt ? new Date(data.stats.latestUpdatedAt).toLocaleDateString() : '--'"
        :hint="'最近一次编辑日期'"
        icon="lucide:history"
      />
    </div>

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)]">
      <UiCard class="p-6">
        <div class="mb-5 flex items-center justify-between">
          <div>
            <p class="text-sm font-semibold text-[var(--text-primary)]">
              发布趋势
            </p>
            <p class="mt-1 text-xs text-[var(--text-secondary)]">
              按月份统计近期文章数量
            </p>
          </div>
          <UiButton variant="outline" size="sm" @click="refresh">
            刷新
          </UiButton>
        </div>

        <div v-if="pending" class="grid h-72 place-items-center text-sm text-[var(--text-secondary)]">
          正在加载仪表盘...
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="item in data?.byMonth || []"
            :key="item.label"
            class="grid grid-cols-[4rem_minmax(0,1fr)_3rem] items-center gap-3"
          >
            <span class="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
              {{ item.label }}
            </span>
            <div class="h-3 rounded-full bg-black/[0.06] dark:bg-white/[0.08]">
              <div
                class="h-full rounded-full bg-black dark:bg-white"
                :style="{ width: `${(item.value / maxMonthValue) * 100}%` }"
              />
            </div>
            <span class="text-sm font-semibold text-[var(--text-primary)]">
              {{ item.value }}
            </span>
          </div>
        </div>
      </UiCard>

      <UiCard class="p-6">
        <div class="mb-5">
          <p class="text-sm font-semibold text-[var(--text-primary)]">
            快捷操作
          </p>
          <p class="mt-1 text-xs text-[var(--text-secondary)]">
            直接进入最常用的后台功能。
          </p>
        </div>

        <div class="space-y-3">
          <NuxtLink
            to="/admin/articles/new"
            class="flex items-center justify-between rounded-2xl border border-[var(--border)] px-4 py-4 transition hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
          >
            <span>
              <span class="block text-sm font-semibold text-[var(--text-primary)]">新建文章</span>
              <span class="block text-xs text-[var(--text-secondary)]">打开 TinyMCE 开始写作</span>
            </span>
            <Icon name="lucide:arrow-right" class="size-4 text-[var(--text-secondary)]" />
          </NuxtLink>

          <NuxtLink
            to="/admin/articles"
            class="flex items-center justify-between rounded-2xl border border-[var(--border)] px-4 py-4 transition hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
          >
            <span>
              <span class="block text-sm font-semibold text-[var(--text-primary)]">文章管理</span>
              <span class="block text-xs text-[var(--text-secondary)]">搜索、筛选、编辑和删除文章</span>
            </span>
            <Icon name="lucide:arrow-right" class="size-4 text-[var(--text-secondary)]" />
          </NuxtLink>

          <NuxtLink
            to="/admin/settings"
            class="flex items-center justify-between rounded-2xl border border-[var(--border)] px-4 py-4 transition hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
          >
            <span>
              <span class="block text-sm font-semibold text-[var(--text-primary)]">设置</span>
              <span class="block text-xs text-[var(--text-secondary)]">查看数据库与编辑器配置</span>
            </span>
            <Icon name="lucide:arrow-right" class="size-4 text-[var(--text-secondary)]" />
          </NuxtLink>
        </div>
      </UiCard>
    </div>

    <UiCard class="p-6">
      <div class="mb-5 flex items-center justify-between">
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">
            最近文章
          </p>
          <p class="mt-1 text-xs text-[var(--text-secondary)]">
            后台最近编辑的内容
          </p>
        </div>
        <NuxtLink to="/admin/articles">
          <UiButton variant="secondary" size="sm">
            打开管理页
          </UiButton>
        </NuxtLink>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full min-w-[640px] text-left text-sm">
          <thead class="text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)]">
            <tr>
              <th class="pb-3">标题</th>
              <th class="pb-3">状态</th>
              <th class="pb-3">更新时间</th>
              <th class="pb-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="article in data?.recentArticles || []"
              :key="article.id"
              class="border-t border-[var(--border)]"
            >
              <td class="py-4">
                <p class="font-medium text-[var(--text-primary)]">
                  {{ article.title }}
                </p>
                <p class="mt-1 text-xs text-[var(--text-secondary)]">
                  /posts/{{ article.slug }}
                </p>
              </td>
              <td class="py-4">
                <UiBadge :variant="article.published ? 'success' : 'warning'">
                  {{ article.published ? '已发布' : '草稿' }}
                </UiBadge>
              </td>
              <td class="py-4 text-[var(--text-secondary)]">
                {{ new Date(article.updatedAt).toLocaleString() }}
              </td>
              <td class="py-4 text-right">
                <NuxtLink :to="`/admin/articles/${article.id}`">
                  <UiButton variant="ghost" size="sm">
                    编辑
                  </UiButton>
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UiCard>
  </div>
</template>
