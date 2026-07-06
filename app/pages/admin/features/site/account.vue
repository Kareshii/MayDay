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
</script>

<template>
  <div class="cms-page space-y-4">
    <AdminPageHeader title="账号设置" subtitle="" />

    <UiCard class="overflow-hidden p-0">
      <div class="border-b border-[var(--border-soft)] bg-[var(--surface-low)] px-6 py-4">
        <h3 class="text-base font-bold text-[var(--text-primary)]">
          安全与账号
        </h3>
        <p class="mt-0.5 text-xs text-[var(--text-secondary)]">
          修改后台管理员用户名和密码。
        </p>
      </div>

      <div class="divide-y divide-[var(--border-soft)] px-6">
        <div class="flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
          <div class="md:w-1/3">
            <h4 class="text-sm font-medium text-[var(--text-primary)]">管理员用户名</h4>
          </div>
          <div class="md:w-1/2">
            <UiInput v-model="accountForm.adminUsername" placeholder="默认为 admin" />
          </div>
        </div>

        <div class="flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
          <div class="md:w-1/3">
            <h4 class="text-sm font-medium text-[var(--text-primary)]">更新密码</h4>
            <p class="mt-1 text-xs text-[var(--text-secondary)]">填写即代表修改。若使用环境变量管理则无法在此修改。</p>
          </div>
          <div class="space-y-2 md:w-1/2">
            <UiInput v-model="accountForm.currentPassword" type="password" placeholder="当前密码" />
            <UiInput v-model="accountForm.newPassword" type="password" placeholder="新密码 (至少8位)" />
            <UiInput v-model="accountForm.newPasswordConfirm" type="password" placeholder="确认新密码" />
          </div>
        </div>

        <div class="flex justify-end py-5">
          <UiButton :disabled="accountSaving" variant="secondary" @click="saveAccount(accountForm)">
            验证并更新账号
          </UiButton>
        </div>
      </div>
    </UiCard>
  </div>
</template>
