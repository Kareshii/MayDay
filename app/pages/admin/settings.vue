<script setup lang="ts">
definePageMeta({
  layout: 'admin',
})

useSeoMeta({
  title: '后台设置',
  description: '查看当前后台的技术栈与数据库配置。',
})

const { data, pending, error } = await useFetch<{
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
const { showErrorToast } = useAdminToast()

watch(error, (value) => {
  if (value) {
    showErrorToast('系统设置加载失败', value.message)
  }
}, { immediate: true })
</script>

<template>
  <div class="cms-page space-y-6">
    <AdminPageHeader title="系统配置" subtitle="" />

    <div v-if="pending" class="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-card)] px-5 py-12 text-center text-sm text-[var(--text-secondary)]">
      正在加载配置...
    </div>

    <template v-else>
      <UiCard class="p-0 overflow-hidden">
        <div class="flex items-center justify-between border-b border-[var(--border-soft)] bg-[var(--surface-low)] px-6 py-4">
          <div>
            <h3 class="text-base font-bold text-[var(--text-primary)]">运行环境参数</h3>
            <p class="mt-0.5 text-xs text-[var(--text-secondary)]">只读信息。如需修改，请在宿主机更新环境变量或配置文件并重启服务。</p>
          </div>
        </div>

        <div class="divide-y divide-[var(--border-soft)] px-6">
          <div class="flex flex-col gap-4 py-5 md:flex-row md:items-start md:justify-between">
            <div class="md:w-1/3">
              <h4 class="text-sm font-medium text-[var(--text-primary)]">数据库配置状态</h4>
              <p class="mt-1 text-xs text-[var(--text-secondary)]">当前后台的数据持久化来源及连接串。</p>
            </div>
            <div class="flex flex-1 flex-col gap-3 md:w-1/2">
              <div class="flex items-center justify-between">
                <span class="font-mono text-sm font-medium text-[var(--text-primary)]">{{ data?.databaseProvider }}</span>
                <UiBadge :variant="data?.databaseConfigured ? 'success' : 'warning'">
                  {{ data?.databaseConfigured ? 'DATABASE_URL 已就绪' : 'DATABASE_URL 缺失' }}
                </UiBadge>
              </div>
              <div v-if="data?.databaseUrl" class="rounded-lg bg-[var(--surface-card)] px-3 py-2 border border-[var(--border-soft)]">
                <code class="break-all font-mono text-[11px] text-[var(--text-secondary)]">
                  {{ data.databaseUrl }}
                </code>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
            <div class="md:w-1/3">
              <h4 class="text-sm font-medium text-[var(--text-primary)]">内容编辑器</h4>
              <p class="mt-1 text-xs text-[var(--text-secondary)]">Markdown 核心解析与渲染引擎。</p>
            </div>
            <div class="flex flex-1 items-center md:w-1/2">
              <span class="font-mono text-sm text-[var(--text-primary)]">{{ data?.editor }}</span>
            </div>
          </div>

          <div class="flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
            <div class="md:w-1/3">
              <h4 class="text-sm font-medium text-[var(--text-primary)]">ORM 数据映射</h4>
              <p class="mt-1 text-xs text-[var(--text-secondary)]">Schema 定义和数据库访问控制。</p>
            </div>
            <div class="flex flex-1 items-center md:w-1/2">
              <span class="font-mono text-sm text-[var(--text-primary)]">{{ data?.orm }}</span>
            </div>
          </div>

          <div class="flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
            <div class="md:w-1/3">
              <h4 class="text-sm font-medium text-[var(--text-primary)]">UI 界面基座</h4>
              <p class="mt-1 text-xs text-[var(--text-secondary)]">前端视觉与交互的基础库。</p>
            </div>
            <div class="flex flex-1 items-center md:w-1/2">
              <span class="font-mono text-sm text-[var(--text-primary)]">{{ data?.ui }}</span>
            </div>
          </div>
        </div>
      </UiCard>

      <UiCard class="p-0 overflow-hidden">
        <div class="flex items-center justify-between border-b border-[var(--border-soft)] bg-[var(--surface-low)] px-6 py-4">
          <div>
            <h3 class="text-base font-bold text-[var(--text-primary)]">鉴权安全与会话</h3>
            <p class="mt-0.5 text-xs text-[var(--text-secondary)]">系统访问控制与密码配置状态。</p>
          </div>
        </div>

        <div class="divide-y divide-[var(--border-soft)] px-6">
          <div class="flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
            <div class="md:w-1/3">
              <h4 class="text-sm font-medium text-[var(--text-primary)]">管理账户标识</h4>
              <p class="mt-1 text-xs text-[var(--text-secondary)]">用于登录后台的根管理员用户名。</p>
            </div>
            <div class="flex flex-1 items-center md:w-1/2">
              <span class="font-mono text-sm font-medium text-[var(--text-primary)]">{{ data?.auth.username || 'admin' }}</span>
            </div>
          </div>
          
          <div class="flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
            <div class="md:w-1/3">
              <h4 class="text-sm font-medium text-[var(--text-primary)]">环境变量密码验证</h4>
              <p class="mt-1 text-xs text-[var(--text-secondary)]">是否使用 `.env` 强制配置根密码。</p>
            </div>
            <div class="flex flex-1 items-center md:w-1/2">
              <UiBadge :variant="data?.auth.configured ? 'success' : 'warning'">
                {{ data?.auth.configured ? 'ADMIN_PASSWORD 已配置' : 'ADMIN_PASSWORD 未配置' }}
              </UiBadge>
            </div>
          </div>

          <div class="flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
            <div class="md:w-1/3">
              <h4 class="text-sm font-medium text-[var(--text-primary)]">会话签名密钥</h4>
              <p class="mt-1 text-xs text-[var(--text-secondary)]">用于保证 Cookie 防篡改的密钥状态。</p>
            </div>
            <div class="flex flex-1 items-center md:w-1/2">
              <UiBadge :variant="data?.auth.sessionSecretConfigured ? 'success' : 'secondary'">
                {{ data?.auth.sessionSecretConfigured ? 'SESSION_SECRET 已配置' : '使用密码做默认签名' }}
              </UiBadge>
            </div>
          </div>
          
          <div class="flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
            <div class="md:w-1/3">
              <h4 class="text-sm font-medium text-[var(--text-primary)]">会话存活时长 (TTL)</h4>
              <p class="mt-1 text-xs text-[var(--text-secondary)]">登录状态的保持时间（以小时为单位）。</p>
            </div>
            <div class="flex flex-1 items-center md:w-1/2">
              <span class="font-mono text-sm text-[var(--text-primary)]">{{ data?.auth.sessionTtlHours || 0 }} 小时</span>
            </div>
          </div>
        </div>
      </UiCard>

    </template>
  </div>
</template>
