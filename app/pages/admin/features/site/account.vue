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
const { data: sessionInfo } = await useFetch<{
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
    disabled: accountSaving.value || !canSubmit.value,
    onClick: submitAccount,
  },
])
</script>

<template>
  <div class="cms-page space-y-5">
    <AdminPageHeader title="账号设置" subtitle="管理员凭据与安全" :actions="headerActions" />

    <AdminSiteSettingsNav />

    <section class="grid overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--surface-card)] sm:grid-cols-3">
      <div class="flex min-h-24 items-center gap-3 border-b border-[var(--border-soft)] px-5 py-4 sm:border-b-0 sm:border-r">
        <span class="grid size-9 shrink-0 place-items-center rounded-md bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300">
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
        <span class="grid size-9 shrink-0 place-items-center rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
          <Icon name="lucide:shield-check" class="size-4" />
        </span>
        <div>
          <p class="text-xs font-medium text-[var(--text-secondary)]">登录状态</p>
          <p class="mt-1 text-sm font-semibold text-[var(--text-primary)]">已认证</p>
        </div>
      </div>
      <div class="flex min-h-24 items-center gap-3 px-5 py-4">
        <span class="grid size-9 shrink-0 place-items-center rounded-md bg-violet-50 text-violet-700 dark:bg-violet-400/10 dark:text-violet-300">
          <Icon name="lucide:key-round" class="size-4" />
        </span>
        <div>
          <p class="text-xs font-medium text-[var(--text-secondary)]">密码要求</p>
          <p class="mt-1 text-sm font-semibold text-[var(--text-primary)]">至少 8 位</p>
        </div>
      </div>
    </section>

    <div class="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
      <form @submit.prevent="submitAccount">
        <AdminSettingsPanel title="更新登录凭据" description="提交后当前会话继续有效" icon="lucide:shield-user">
          <AdminSettingsRow label="管理员用户名">
            <div class="relative">
              <Icon name="lucide:user-round" class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <UiInput
                v-model="accountForm.adminUsername"
                autocomplete="username"
                placeholder="admin"
                class="rounded-md border-[var(--border-soft)] bg-[var(--surface-low)] pl-9"
              />
            </div>
          </AdminSettingsRow>

          <AdminSettingsRow label="当前密码" description="用于验证本次修改">
            <div class="relative">
              <Icon name="lucide:lock-keyhole" class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <UiInput
                v-model="accountForm.currentPassword"
                :type="showPasswords ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="当前密码"
                class="rounded-md border-[var(--border-soft)] bg-[var(--surface-low)] pl-9 pr-11"
              />
              <UiButton
                type="button"
                variant="ghost"
                size="icon"
                class="absolute right-1 top-1/2 size-8 -translate-y-1/2 text-[var(--text-secondary)]"
                :title="showPasswords ? '隐藏密码' : '显示密码'"
                :aria-label="showPasswords ? '隐藏密码' : '显示密码'"
                @click="showPasswords = !showPasswords"
              >
                <Icon :name="showPasswords ? 'lucide:eye-off' : 'lucide:eye'" class="size-4" />
              </UiButton>
            </div>
          </AdminSettingsRow>

          <AdminSettingsRow label="新密码" description="至少 8 位字符">
            <UiInput
              v-model="accountForm.newPassword"
              :type="showPasswords ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="新密码"
              class="rounded-md border-[var(--border-soft)] bg-[var(--surface-low)]"
            />
          </AdminSettingsRow>

          <AdminSettingsRow label="确认新密码">
            <UiInput
              v-model="accountForm.newPasswordConfirm"
              :type="showPasswords ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="再次输入新密码"
              class="rounded-md border-[var(--border-soft)] bg-[var(--surface-low)]"
            />
          </AdminSettingsRow>
        </AdminSettingsPanel>
      </form>

      <div class="space-y-4">
        <AdminSettingsPanel title="密码检查" icon="lucide:list-checks">
          <div class="space-y-4 px-5 py-5">
            <div class="flex items-center gap-3 text-sm">
              <Icon :name="accountForm.currentPassword ? 'lucide:circle-check' : 'lucide:circle'" :class="['size-4', accountForm.currentPassword ? 'text-emerald-500' : 'text-[var(--text-muted)]']" />
              <span class="text-[var(--text-primary)]">已填写当前密码</span>
            </div>
            <div class="flex items-center gap-3 text-sm">
              <Icon :name="passwordLengthValid ? 'lucide:circle-check' : 'lucide:circle'" :class="['size-4', passwordLengthValid ? 'text-emerald-500' : 'text-[var(--text-muted)]']" />
              <span class="text-[var(--text-primary)]">新密码至少 8 位</span>
            </div>
            <div class="flex items-center gap-3 text-sm">
              <Icon :name="passwordsMatch ? 'lucide:circle-check' : 'lucide:circle'" :class="['size-4', passwordsMatch ? 'text-emerald-500' : 'text-[var(--text-muted)]']" />
              <span class="text-[var(--text-primary)]">两次输入一致</span>
            </div>
          </div>
        </AdminSettingsPanel>

        <div class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-sm leading-6 text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
          <div class="flex items-start gap-3">
            <Icon name="lucide:triangle-alert" class="mt-1 size-4 shrink-0" />
            <p>环境变量管理的密码无法在后台修改。</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
