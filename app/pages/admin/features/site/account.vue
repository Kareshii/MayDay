<script setup lang="ts">
definePageMeta({
  layout: 'admin',
})

useSeoMeta({
  title: '账号设置',
  description: '维护后台管理员账号。',
})

const {
  accountSaving,
  saveAccount,
} = useAdminAccountSettings()

const accountForm = reactive({
  adminUsername: '',
  currentPassword: '',
  newPassword: '',
  newPasswordConfirm: '',
})

const showPasswords = ref(false)
const { data: sessionInfo, pending, error, refresh } = await useFetch<{
  username: string | null
  defaultUsername: string
}>('/api/admin/session')

watch(sessionInfo, (value) => {
  if (!accountForm.adminUsername) {
    accountForm.adminUsername = value?.username || value?.defaultUsername || 'admin'
  }
}, { immediate: true })

const passwordsMatch = computed(() => Boolean(accountForm.newPassword)
  && accountForm.newPassword === accountForm.newPasswordConfirm)
const passwordLengthValid = computed(() => accountForm.newPassword.length >= 8)
const canSubmit = computed(() => Boolean(
  accountForm.adminUsername.trim()
  && accountForm.currentPassword
  && passwordLengthValid.value
  && passwordsMatch.value,
))

async function submitAccount() {
  if (!canSubmit.value || accountSaving.value) {
    return
  }

  await saveAccount(accountForm)
}

const headerActions = computed(() => [
  {
    label: accountSaving.value ? '更新中...' : '更新账号',
    icon: 'lucide:save',
    disabled: pending.value || accountSaving.value || !canSubmit.value,
    onClick: submitAccount,
  },
])
</script>

<template>
  <div class="cms-page space-y-5">
    <AdminPageHeader title="账号设置" subtitle="管理员凭据与安全" :actions="headerActions" />

    <AdminSiteSettingsNav />

    <UiAlert v-if="error" variant="destructive">
      <Icon name="lucide:circle-alert" />
      <UiAlertTitle>账号信息加载失败</UiAlertTitle>
      <UiAlertDescription>{{ error.message }}</UiAlertDescription>
      <UiAlertAction>
        <UiButton variant="outline" size="sm" @click="refresh">
          <Icon name="lucide:refresh-cw" class="size-4" />
          重试
        </UiButton>
      </UiAlertAction>
    </UiAlert>

    <div v-else-if="pending" class="max-w-xl space-y-4" aria-label="正在加载账号设置">
      <UiSkeleton class="h-24 w-full" />
      <UiSkeleton class="h-72 w-full" />
      <UiSkeleton class="h-40 w-full" />
    </div>

    <template v-else>
    <section class="grid overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--surface-card)] sm:grid-cols-3">
      <div class="flex min-h-24 items-center gap-3 border-b border-[var(--border-soft)] px-5 py-4 sm:border-b-0 sm:border-r">
        <span class="grid size-9 shrink-0 place-items-center rounded-md bg-[var(--surface-high)] text-[var(--text-secondary)]">
          <Icon name="lucide:user-round" class="size-4" />
        </span>
        <div class="min-w-0">
          <p class="text-xs font-medium text-[var(--text-secondary)]">当前账号</p>
          <p class="mt-1 truncate text-sm font-semibold text-[var(--text-primary)]">
            {{ sessionInfo?.username || sessionInfo?.defaultUsername || 'admin' }}
          </p>
        </div>
      </div>
      <div class="flex min-h-24 items-center gap-3 border-b border-[var(--border-soft)] px-5 py-4 sm:border-b-0 sm:border-r">
        <span class="grid size-9 shrink-0 place-items-center rounded-md bg-[var(--surface-high)] text-[var(--text-secondary)]">
          <Icon name="lucide:shield-check" class="size-4" />
        </span>
        <div>
          <p class="text-xs font-medium text-[var(--text-secondary)]">登录状态</p>
          <p class="mt-1 text-sm font-semibold text-[var(--text-primary)]">已认证</p>
        </div>
      </div>
      <div class="flex min-h-24 items-center gap-3 px-5 py-4">
        <span class="grid size-9 shrink-0 place-items-center rounded-md bg-[var(--surface-high)] text-[var(--text-secondary)]">
          <Icon name="lucide:key-round" class="size-4" />
        </span>
        <div>
          <p class="text-xs font-medium text-[var(--text-secondary)]">密码要求</p>
          <p class="mt-1 text-sm font-semibold text-[var(--text-primary)]">至少 8 位</p>
        </div>
      </div>
    </section>

    <form class="max-w-xl space-y-4" @submit.prevent="submitAccount">
        <AdminSettingsPanel title="更新登录凭据" description="提交后当前会话继续有效" icon="lucide:shield-user">
          <AdminSettingsRow label="管理员用户名">
            <UiInput
              v-model="accountForm.adminUsername"
              aria-label="管理员用户名"
              autocomplete="username"
              placeholder="admin"
            />
          </AdminSettingsRow>

          <AdminSettingsRow label="当前密码" description="用于验证本次修改">
            <div class="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
              <UiInput
                v-model="accountForm.currentPassword"
                aria-label="当前密码"
                :type="showPasswords ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="当前密码"
              />
              <UiTooltip>
                <UiTooltipTrigger as-child>
                  <UiButton
                    type="button"
                    variant="outline"
                    size="icon"
                    :aria-label="showPasswords ? '隐藏密码' : '显示密码'"
                    @click="showPasswords = !showPasswords"
                  >
                    <Icon :name="showPasswords ? 'lucide:eye-off' : 'lucide:eye'" class="size-4" />
                  </UiButton>
                </UiTooltipTrigger>
                <UiTooltipContent>{{ showPasswords ? '隐藏密码' : '显示密码' }}</UiTooltipContent>
              </UiTooltip>
            </div>
          </AdminSettingsRow>

          <AdminSettingsRow label="新密码" description="至少 8 位字符">
            <UiInput
              v-model="accountForm.newPassword"
              aria-label="新密码"
              :type="showPasswords ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="新密码"
            />
          </AdminSettingsRow>

          <AdminSettingsRow label="确认新密码">
            <UiInput
              v-model="accountForm.newPasswordConfirm"
              aria-label="确认新密码"
              :type="showPasswords ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="再次输入新密码"
            />
          </AdminSettingsRow>
        </AdminSettingsPanel>

        <AdminSettingsPanel title="密码检查" icon="lucide:list-checks">
          <div class="space-y-4 px-5 py-5">
            <div class="flex items-center gap-3 text-sm">
              <Icon :name="accountForm.currentPassword ? 'lucide:circle-check' : 'lucide:circle'" :class="['size-4', accountForm.currentPassword ? 'text-[var(--success)]' : 'text-[var(--text-muted)]']" />
              <span class="text-[var(--text-primary)]">已填写当前密码</span>
            </div>
            <div class="flex items-center gap-3 text-sm">
              <Icon :name="passwordLengthValid ? 'lucide:circle-check' : 'lucide:circle'" :class="['size-4', passwordLengthValid ? 'text-[var(--success)]' : 'text-[var(--text-muted)]']" />
              <span class="text-[var(--text-primary)]">新密码至少 8 位</span>
            </div>
            <div class="flex items-center gap-3 text-sm">
              <Icon :name="passwordsMatch ? 'lucide:circle-check' : 'lucide:circle'" :class="['size-4', passwordsMatch ? 'text-[var(--success)]' : 'text-[var(--text-muted)]']" />
              <span class="text-[var(--text-primary)]">两次输入一致</span>
            </div>
          </div>
        </AdminSettingsPanel>

        <UiAlert variant="warning">
          <Icon name="lucide:triangle-alert" />
          <UiAlertTitle>环境变量优先</UiAlertTitle>
          <UiAlertDescription>环境变量管理的密码无法在后台修改。</UiAlertDescription>
        </UiAlert>
    </form>
    </template>
  </div>
</template>
