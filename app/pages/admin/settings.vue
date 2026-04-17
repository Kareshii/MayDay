<script setup lang="ts">
definePageMeta({
  layout: 'admin',
})

useSeoMeta({
  title: '后台设置',
  description: '查看当前后台的技术栈与数据库配置。',
})

const { data, pending, error, refresh } = await useFetch<{
  databaseConfigured: boolean
  databaseProvider: string
  editor: string
  orm: string
  ui: string
  auth: {
    configured: boolean
    username: string
    sessionSecretConfigured: boolean
    sessionTtlHours: number
  }
}>('/api/admin/settings')
</script>

<template>
  <div class="cms-page space-y-7">
    <section class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="cms-page-title">
          系统设置
        </h1>
        <p class="cms-page-subtitle">
          管理站点的核心配置和基础信息。
        </p>
      </div>

      <UiButton variant="outline" size="sm" @click="refresh">
        <Icon name="lucide:refresh-cw" class="size-4" />
        刷新
      </UiButton>
    </section>

    <div v-if="error" class="rounded-2xl border border-red-300 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/12 dark:text-red-200">
      {{ error.message }}
    </div>

    <div v-if="pending" class="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-card)] px-5 py-12 text-center text-sm text-[var(--text-secondary)]">
      正在加载设置...
    </div>

    <template v-else>
      <UiCard class="overflow-hidden p-0">
        <div class="border-b border-[var(--border-soft)] bg-[var(--surface-low)] px-6 py-5">
          <div class="flex items-center gap-2">
            <Icon name="lucide:sliders-horizontal" class="size-4 text-[var(--primary)]" />
            <p class="text-lg font-bold tracking-tight text-[var(--text-primary)]">
              常规设置
            </p>
          </div>
        </div>

        <div class="space-y-8 px-6 py-7">
          <div class="grid gap-6 md:grid-cols-[13rem_minmax(0,1fr)] md:items-start">
            <div>
              <p class="text-sm font-semibold text-[var(--text-primary)]">
                数据库
              </p>
              <p class="mt-1 text-xs leading-6 text-[var(--text-secondary)]">
                当前后台要求 `DATABASE_URL` 指向一个可访问的 PostgreSQL 实例。
              </p>
            </div>
            <div class="space-y-3">
              <div class="rounded-xl border border-[var(--border-soft)] bg-[var(--surface-card)] px-4 py-3 text-sm text-[var(--text-primary)]">
                {{ data?.databaseProvider }}
              </div>
              <UiBadge :variant="data?.databaseConfigured ? 'success' : 'warning'">
                {{ data?.databaseConfigured ? 'DATABASE_URL 已配置' : 'DATABASE_URL 缺失' }}
              </UiBadge>
            </div>
          </div>

          <div class="grid gap-6 md:grid-cols-[13rem_minmax(0,1fr)] md:items-start">
            <div>
              <p class="text-sm font-semibold text-[var(--text-primary)]">
                编辑器
              </p>
              <p class="mt-1 text-xs leading-6 text-[var(--text-secondary)]">
                富文本编辑通过 Vue 客户端组件中的 TinyMCE 完成。
              </p>
            </div>
            <div class="rounded-xl border border-[var(--border-soft)] bg-[var(--surface-card)] px-4 py-3 text-sm text-[var(--text-primary)]">
              {{ data?.editor }}
            </div>
          </div>

          <div class="grid gap-6 md:grid-cols-[13rem_minmax(0,1fr)] md:items-start">
            <div>
              <p class="text-sm font-semibold text-[var(--text-primary)]">
                ORM
              </p>
              <p class="mt-1 text-xs leading-6 text-[var(--text-secondary)]">
                Schema 定义和数据库访问由 Drizzle ORM 与 `postgres` 驱动。
              </p>
            </div>
            <div class="rounded-xl border border-[var(--border-soft)] bg-[var(--surface-card)] px-4 py-3 text-sm text-[var(--text-primary)]">
              {{ data?.orm }}
            </div>
          </div>

          <div class="grid gap-6 md:grid-cols-[13rem_minmax(0,1fr)] md:items-start">
            <div>
              <p class="text-sm font-semibold text-[var(--text-primary)]">
                界面栈
              </p>
              <p class="mt-1 text-xs leading-6 text-[var(--text-secondary)]">
                后台使用符合 shadcn 风格的 Vue 组件与 Reka UI primitives。
              </p>
            </div>
            <div class="rounded-xl border border-[var(--border-soft)] bg-[var(--surface-card)] px-4 py-3 text-sm text-[var(--text-primary)]">
              {{ data?.ui }}
            </div>
          </div>

          <div class="grid gap-6 border-t border-[var(--border-soft)] pt-8 md:grid-cols-[13rem_minmax(0,1fr)] md:items-start">
            <div>
              <p class="text-sm font-semibold text-[var(--text-primary)]">
                鉴权
              </p>
              <p class="mt-1 text-xs leading-6 text-[var(--text-secondary)]">
                后台会话采用 Cookie Session，默认用户名是 admin。
              </p>
            </div>
            <div class="space-y-3">
              <div class="rounded-xl border border-[var(--border-soft)] bg-[var(--surface-card)] px-4 py-3 text-sm text-[var(--text-primary)]">
                用户名：{{ data?.auth.username || 'admin' }} · 会话有效期约 {{ data?.auth.sessionTtlHours || 0 }} 小时
              </div>

              <div class="flex flex-wrap gap-2">
                <UiBadge :variant="data?.auth.configured ? 'success' : 'warning'">
                  {{ data?.auth.configured ? 'ADMIN_PASSWORD 已配置' : 'ADMIN_PASSWORD 缺失' }}
                </UiBadge>
                <UiBadge :variant="data?.auth.sessionSecretConfigured ? 'success' : 'warning'">
                  {{ data?.auth.sessionSecretConfigured ? 'ADMIN_SESSION_SECRET 已配置' : '使用密码作为签名密钥' }}
                </UiBadge>
              </div>
            </div>
          </div>
        </div>
      </UiCard>

      <div class="flex justify-end">
        <UiButton variant="secondary" disabled>
          保存更改（当前页只读）
        </UiButton>
      </div>
    </template>
  </div>
</template>
