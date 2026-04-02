<script setup lang="ts">
definePageMeta({
  layout: 'admin',
})

useSeoMeta({
  title: '后台设置',
  description: '查看当前后台的技术栈与数据库配置。',
})

const { data, pending, error, refresh } = await useFetch('/api/admin/settings')
</script>

<template>
  <div class="space-y-6">
    <div v-if="error" class="rounded-2xl border border-red-300 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
      {{ error.message }}
    </div>

    <div class="flex justify-end">
      <UiButton variant="outline" size="sm" @click="refresh">
        刷新
      </UiButton>
    </div>

    <div v-if="pending" class="rounded-2xl border border-[var(--border)] px-5 py-12 text-center text-sm text-[var(--text-secondary)]">
      正在加载设置...
    </div>

    <div v-else class="grid gap-6 lg:grid-cols-2">
      <UiCard class="p-6">
        <p class="section-kicker">数据库</p>
        <h2 class="mt-3 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
          {{ data?.databaseProvider }}
        </h2>
        <p class="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
          当前后台要求 `DATABASE_URL` 指向一个可访问的 PostgreSQL 实例。
        </p>
        <div class="mt-5">
          <UiBadge :variant="data?.databaseConfigured ? 'success' : 'warning'">
            {{ data?.databaseConfigured ? 'DATABASE_URL 已配置' : 'DATABASE_URL 缺失' }}
          </UiBadge>
        </div>
      </UiCard>

      <UiCard class="p-6">
        <p class="section-kicker">编辑器</p>
        <h2 class="mt-3 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
          {{ data?.editor }}
        </h2>
        <p class="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
          富文本编辑通过 Vue 客户端组件中的 TinyMCE 完成。
        </p>
      </UiCard>

      <UiCard class="p-6">
        <p class="section-kicker">ORM</p>
        <h2 class="mt-3 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
          {{ data?.orm }}
        </h2>
        <p class="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
          Schema 定义和数据库访问由 Drizzle ORM 与 `postgres` 驱动。
        </p>
      </UiCard>

      <UiCard class="p-6">
        <p class="section-kicker">界面栈</p>
        <h2 class="mt-3 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
          {{ data?.ui }}
        </h2>
        <p class="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
          因为这是 Vue 项目，后台使用的是符合 shadcn 风格的 Vue 组件和 Reka UI primitives，而不是 React 专用的 Radix 包。
        </p>
      </UiCard>
    </div>
  </div>
</template>
