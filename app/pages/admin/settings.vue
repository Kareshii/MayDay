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
  databaseUrl: string | null
  databaseSource: string | null
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
const { showErrorToast } = useAdminToast()

watch(error, (value) => {
  if (value) {
    showErrorToast('系统设置加载失败', value.message)
  }
}, { immediate: true })
</script>

<template>
  <div class="cms-page space-y-6">
    <AdminPageHeader title="系统配置" subtitle="运行环境、数据库与会话状态" />

    <UiAlert v-if="error" variant="destructive">
      <Icon name="lucide:circle-alert" />
      <UiAlertTitle>系统配置加载失败</UiAlertTitle>
      <UiAlertDescription>{{ error.message }}</UiAlertDescription>
      <UiAlertAction>
        <UiButton variant="outline" size="sm" @click="refresh">
          <Icon name="lucide:refresh-cw" class="size-4" />
          重试
        </UiButton>
      </UiAlertAction>
    </UiAlert>

    <div v-else-if="pending" class="max-w-xl space-y-4" aria-label="正在加载系统配置">
      <UiSkeleton class="h-16 w-full" />
      <UiSkeleton class="h-72 w-full" />
      <UiSkeleton class="h-72 w-full" />
    </div>

    <div v-else class="max-w-xl space-y-4">
      <UiAlert :variant="data?.databaseConfigured ? 'success' : 'warning'">
        <Icon :name="data?.databaseConfigured ? 'lucide:database-check' : 'lucide:database-zap'" />
        <UiAlertTitle>
          {{ data?.databaseConfigured ? '数据库连接已配置' : '数据库连接待配置' }}
        </UiAlertTitle>
        <UiAlertDescription>
          {{ data?.databaseConfigured
            ? `${data.databaseProvider} 已可用，配置来源为 ${data.databaseSource || '环境变量'}。`
            : '请在宿主机配置 DATABASE_URL 后重启服务。' }}
        </UiAlertDescription>
      </UiAlert>

      <AdminSettingsPanel title="运行环境参数" description="只读信息；修改后需要重启服务" icon="lucide:server-cog">
        <AdminSettingsRow label="数据库提供方" description="当前后台的数据持久化来源">
          <div class="flex flex-wrap items-center gap-3">
            <span class="font-mono text-sm font-medium text-[var(--text-primary)]">{{ data?.databaseProvider || '未配置' }}</span>
            <UiBadge :variant="data?.databaseConfigured ? 'success' : 'warning'">
              {{ data?.databaseConfigured ? 'DATABASE_URL 已就绪' : 'DATABASE_URL 缺失' }}
            </UiBadge>
          </div>
          <code v-if="data?.databaseUrl" class="mt-3 block break-all rounded-md border border-[var(--border-soft)] bg-[var(--surface-low)] px-3 py-2 font-mono text-xs text-[var(--text-secondary)]">
            {{ data.databaseUrl }}
          </code>
        </AdminSettingsRow>

        <AdminSettingsRow label="内容编辑器" description="Markdown 核心解析与渲染引擎">
          <span class="font-mono text-sm text-[var(--text-primary)]">{{ data?.editor || '—' }}</span>
        </AdminSettingsRow>

        <AdminSettingsRow label="ORM 数据映射" description="Schema 定义和数据库访问控制">
          <span class="font-mono text-sm text-[var(--text-primary)]">{{ data?.orm || '—' }}</span>
        </AdminSettingsRow>

        <AdminSettingsRow label="UI 界面基座" description="前端视觉与交互的基础库">
          <span class="font-mono text-sm text-[var(--text-primary)]">{{ data?.ui || '—' }}</span>
        </AdminSettingsRow>
      </AdminSettingsPanel>

      <AdminSettingsPanel title="鉴权安全与会话" description="访问控制和 Cookie 签名状态" icon="lucide:shield-check">
        <AdminSettingsRow label="管理账户标识" description="用于登录后台的管理员用户名">
          <span class="font-mono text-sm font-medium text-[var(--text-primary)]">{{ data?.auth.username || 'admin' }}</span>
        </AdminSettingsRow>

        <AdminSettingsRow label="环境变量密码验证" description="是否通过环境变量配置后台密码">
          <UiBadge :variant="data?.auth.configured ? 'success' : 'warning'">
            {{ data?.auth.configured ? 'ADMIN_PASSWORD 已配置' : 'ADMIN_PASSWORD 未配置' }}
          </UiBadge>
        </AdminSettingsRow>

        <AdminSettingsRow label="会话签名密钥" description="用于保证 Cookie 防篡改">
          <UiBadge :variant="data?.auth.sessionSecretConfigured ? 'success' : 'secondary'">
            {{ data?.auth.sessionSecretConfigured ? 'SESSION_SECRET 已配置' : '使用密码做默认签名' }}
          </UiBadge>
        </AdminSettingsRow>

        <AdminSettingsRow label="会话存活时长" description="登录状态保持时间">
          <span class="font-mono text-sm text-[var(--text-primary)]">{{ data?.auth.sessionTtlHours || 0 }} 小时</span>
        </AdminSettingsRow>
      </AdminSettingsPanel>
    </div>
  </div>
</template>
