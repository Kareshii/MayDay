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
  <div class="cms-page space-y-7">
    <section class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 class="cms-page-title">
          仪表板概览
        </h1>
        <p class="cms-page-subtitle">
          欢迎回来。这是编辑平台今天的脉动。
        </p>
      </div>

      <UiButton variant="secondary" size="sm" @click="refresh">
        <Icon name="lucide:refresh-cw" class="size-4" />
        刷新数据
      </UiButton>
    </section>

    <div v-if="error" class="rounded-2xl border border-red-300 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/12 dark:text-red-200">
      {{ error.message }}
    </div>

    <div v-if="data?.configMissing" class="rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/12 dark:text-amber-200">
      `DATABASE_URL` 还没有配置，所以后台目前只显示空态。把 PostgreSQL 连接串写进项目环境变量后再刷新。
    </div>

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
    </div>

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1.16fr)_minmax(18rem,0.84fr)]">
      <UiCard class="p-6">
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
          正在加载仪表盘...
        </div>

        <div v-else class="grid h-64 grid-cols-6 items-end gap-3">
          <div
            v-for="item in data?.byMonth || []"
            :key="item.label"
            class="group flex flex-col items-center justify-end gap-2"
          >
            <div class="text-xs font-semibold text-[var(--text-secondary)] opacity-0 transition group-hover:opacity-100">
              {{ item.value }}
            </div>
            <div
              class="w-full rounded-lg bg-[var(--primary)]/80 shadow-[0_10px_18px_-14px_rgba(0,72,141,0.45)]"
              :style="{ height: `${Math.max((item.value / maxMonthValue) * 100, 8)}%` }"
            />
            <div class="text-xs font-medium text-[var(--text-secondary)]">
              {{ item.label }}
            </div>
          </div>
        </div>
      </UiCard>

      <UiCard class="p-6">
        <div class="mb-5 flex items-start justify-between gap-4">
          <div>
            <p class="text-lg font-bold tracking-tight text-[var(--text-primary)]">
              最近动态
            </p>
            <p class="mt-1 text-xs text-[var(--text-secondary)]">
              刚刚更新过的内容
            </p>
          </div>
          <UiBadge :variant="data?.stats.latestUpdatedAt ? 'success' : 'secondary'">
            {{ data?.stats.latestUpdatedAt ? '活跃' : '空闲' }}
          </UiBadge>
        </div>

        <div v-if="pending" class="grid h-52 place-items-center text-sm text-[var(--text-secondary)]">
          正在加载动态...
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="article in (data?.recentArticles || []).slice(0, 4)"
            :key="article.id"
            class="rounded-xl border border-[var(--border-soft)] bg-[var(--surface-low)] px-4 py-3"
          >
            <p class="line-clamp-1 text-sm font-semibold text-[var(--text-primary)]">
              {{ article.title }}
            </p>
            <div class="mt-1 flex items-center justify-between gap-3">
              <p class="text-xs text-[var(--text-secondary)]">
                {{ new Date(article.updatedAt).toLocaleString() }}
              </p>
              <UiBadge :variant="article.published ? 'success' : 'warning'">
                {{ article.published ? '已发布' : '草稿' }}
              </UiBadge>
            </div>
          </div>

          <div v-if="!(data?.recentArticles || []).length" class="rounded-xl border border-dashed border-[var(--border-soft)] px-4 py-6 text-center text-sm text-[var(--text-secondary)]">
            暂无动态
          </div>
        </div>
      </UiCard>
    </div>

    <UiCard class="p-6">
      <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-lg font-bold tracking-tight text-[var(--text-primary)]">
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

      <div v-if="pending" class="rounded-xl border border-dashed border-[var(--border-soft)] px-6 py-12 text-center text-sm text-[var(--text-secondary)]">
        正在加载文章...
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="article in data?.recentArticles || []"
          :key="article.id"
          class="rounded-xl border border-[var(--border-soft)] bg-[var(--surface-low)] px-4 py-4"
        >
          <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p class="font-semibold text-[var(--text-primary)]">
                {{ article.title }}
              </p>
              <p class="mt-1 text-xs text-[var(--text-secondary)]">
                /detail/{{ article.slug }}
              </p>
            </div>

            <div class="flex items-center gap-3">
              <UiBadge :variant="article.published ? 'success' : 'warning'">
                {{ article.published ? '已发布' : '草稿' }}
              </UiBadge>
              <span class="text-xs text-[var(--text-secondary)]">
                {{ new Date(article.updatedAt).toLocaleString() }}
              </span>
              <NuxtLink :to="`/admin/articles/${article.id}`">
                <UiButton variant="ghost" size="sm">
                  编辑
                </UiButton>
              </NuxtLink>
            </div>
          </div>
        </div>

        <div v-if="!(data?.recentArticles || []).length" class="rounded-xl border border-dashed border-[var(--border-soft)] px-6 py-12 text-center text-sm text-[var(--text-secondary)]">
          暂无文章
        </div>
      </div>
    </UiCard>
  </div>
</template>
