<script setup lang="ts">
definePageMeta({
  layout: false,
})

useSeoMeta({
  title: '后台登录',
  description: '登录后台后即可访问文章管理与设置。',
})

function normalizeAdminRedirect(value: unknown) {
  if (typeof value !== 'string') {
    return '/admin'
  }

  if (!value.startsWith('/admin') || value === '/admin/login' || value.startsWith('/admin/login?')) {
    return '/admin'
  }

  return value
}

function getLoginErrorMessage(error: unknown) {
  if (!error || typeof error !== 'object') {
    return '登录失败'
  }

  const responseError = error as {
    data?: { message?: unknown }
    message?: unknown
    status?: unknown
  }

  const message = typeof responseError.data?.message === 'string'
    ? responseError.data.message
    : typeof responseError.message === 'string' ? responseError.message : '登录失败'

  return message.includes('401') || responseError.status === 401
    ? '管理员账号或密码错误。'
    : message
}

const route = useRoute()
const submitting = ref(false)
const { showErrorToast } = useAdminToast()
const form = reactive({
  username: 'admin',
  password: '',
})
const loginErrors = reactive({
  username: '',
  password: '',
})

const { data: sessionInfo, pending, error, refresh } = await useFetch<{
  authenticated: boolean
  configured: boolean
  defaultUsername: string
}>('/api/admin/session')

watchEffect(() => {
  if (sessionInfo.value?.defaultUsername) {
    form.username = sessionInfo.value.defaultUsername
  }
})

const redirectTarget = computed(() => normalizeAdminRedirect(route.query.redirect))

watch(() => form.username, (value) => {
  if (value.trim()) {
    loginErrors.username = ''
  }
})

watch(() => form.password, (value) => {
  if (value) {
    loginErrors.password = ''
  }
})

async function validateLogin() {
  loginErrors.username = form.username.trim() ? '' : '请输入管理员用户名。'
  loginErrors.password = form.password ? '' : '请输入后台密码。'

  const firstErrorId = loginErrors.username
    ? 'admin-login-username'
    : loginErrors.password ? 'admin-login-password' : ''

  if (firstErrorId) {
    await nextTick()
    document.getElementById(firstErrorId)?.focus()
    return false
  }

  return true
}

async function signIn() {
  if (!await validateLogin()) {
    return
  }

  submitting.value = true

  try {
    await $fetch('/api/admin/login', {
      method: 'POST',
      body: form,
    })

    await navigateTo(redirectTarget.value)
  } catch (loginError: unknown) {
    const message = getLoginErrorMessage(loginError)
    loginErrors.password = message
    showErrorToast('登录失败', message)
    await nextTick()
    document.getElementById('admin-login-password')?.focus()
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <main class="flex min-h-dvh items-center justify-center bg-[var(--bg-primary)] px-4 py-10">
    <UiCard class="w-full max-w-md p-7 sm:p-8">
      <div class="flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
        <Icon name="lucide:shield-check" class="size-5" />
        <span>MAYDAY CMS</span>
      </div>
      <h1 class="mt-4 text-3xl font-bold text-[var(--text-primary)]">
        后台登录
      </h1>
      <p class="mt-2 text-sm leading-7 text-[var(--text-secondary)]">
        输入管理员账号信息后进入后台。默认用户名是 {{ sessionInfo?.defaultUsername || 'admin' }}。
      </p>

      <div v-if="pending" class="mt-6 space-y-4" aria-label="正在加载登录状态">
        <UiSkeleton class="h-16 w-full" />
        <UiSkeleton class="h-10 w-full" />
        <UiSkeleton class="h-10 w-full" />
        <UiSkeleton class="h-10 w-full" />
      </div>

      <div v-else class="mt-6 space-y-6">
        <UiAlert v-if="error" variant="destructive">
          <Icon name="lucide:circle-alert" />
          <UiAlertTitle>登录状态加载失败</UiAlertTitle>
          <UiAlertDescription>{{ error.message }}</UiAlertDescription>
          <UiAlertAction>
            <UiButton variant="outline" size="sm" @click="refresh">
              重试
            </UiButton>
          </UiAlertAction>
        </UiAlert>

        <UiAlert v-else-if="route.query.reason === 'not-configured' || !sessionInfo?.configured" variant="warning">
          <Icon name="lucide:shield-alert" />
          <UiAlertTitle>后台密码尚未配置</UiAlertTitle>
          <UiAlertDescription>
            先设置 `ADMIN_PASSWORD`，建议同时设置 `ADMIN_SESSION_SECRET`。
          </UiAlertDescription>
        </UiAlert>

        <form class="max-w-xl space-y-4" novalidate @submit.prevent="signIn">
          <div class="space-y-2">
            <UiLabel for="admin-login-username">用户名 <span class="text-[var(--danger)]">*</span></UiLabel>
            <UiInput
              id="admin-login-username"
              v-model="form.username"
              class="max-w-none"
              autocomplete="username"
              placeholder="admin"
              required
              :aria-invalid="Boolean(loginErrors.username)"
              :aria-describedby="loginErrors.username ? 'admin-login-username-error' : undefined"
              :disabled="submitting || Boolean(error) || !sessionInfo?.configured"
            />
            <p v-if="loginErrors.username" id="admin-login-username-error" class="text-xs text-[var(--danger)]" role="alert">
              {{ loginErrors.username }}
            </p>
          </div>

          <div class="space-y-2">
            <UiLabel for="admin-login-password">密码 <span class="text-[var(--danger)]">*</span></UiLabel>
            <UiInput
              id="admin-login-password"
              v-model="form.password"
              class="max-w-none"
              type="password"
              autocomplete="current-password"
              placeholder="输入后台密码"
              required
              :aria-invalid="Boolean(loginErrors.password)"
              :aria-describedby="loginErrors.password ? 'admin-login-password-error' : undefined"
              :disabled="submitting || Boolean(error) || !sessionInfo?.configured"
            />
            <p v-if="loginErrors.password" id="admin-login-password-error" class="text-xs text-[var(--danger)]" role="alert">
              {{ loginErrors.password }}
            </p>
          </div>

          <UiButton class="w-full" type="submit" :disabled="submitting || Boolean(error) || !sessionInfo?.configured">
            <Icon v-if="submitting" name="lucide:loader-circle" class="size-4 animate-spin" />
            {{ submitting ? '登录中...' : '登录后台' }}
          </UiButton>
        </form>

        <div class="flex flex-wrap items-center justify-between gap-3">
          <NuxtLink to="/" class="flex items-center gap-1.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]">
            <Icon name="lucide:arrow-left" class="size-4" />
            返回前台
          </NuxtLink>
          <UiButton variant="outline" size="sm" @click="refresh">
            <Icon name="lucide:refresh-cw" class="size-4" />
            刷新状态
          </UiButton>
        </div>
      </div>
    </UiCard>
  </main>
</template>
