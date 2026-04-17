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

const route = useRoute()
const submitting = ref(false)
const errorMessage = ref('')
const form = reactive({
  username: 'admin',
  password: '',
})

const { data: sessionInfo, refresh } = await useFetch<{
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

async function signIn() {
  submitting.value = true
  errorMessage.value = ''

  try {
    await $fetch('/api/admin/login', {
      method: 'POST',
      body: form,
    })

    await navigateTo(redirectTarget.value)
  } catch (error: unknown) {
    errorMessage.value = typeof error === 'object' && error && 'message' in error
      ? String((error as { message?: string }).message)
      : '登录失败'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <main class="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,95,184,0.15),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(92,0,202,0.13),transparent_36%)]" />
    <div class="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.58),rgba(255,255,255,0))] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0))]" />

    <UiCard class="relative w-full max-w-md border border-[var(--border-soft)] bg-[var(--surface-card)]/95 p-7 sm:p-8">
      <p class="cms-kicker">
        Mayday CMS
      </p>
      <h1 class="mt-4 text-3xl font-bold tracking-tight text-[var(--text-primary)]">
        后台登录
      </h1>
      <p class="mt-2 text-sm leading-7 text-[var(--text-secondary)]">
        输入管理员账号信息后进入后台。默认用户名是 {{ sessionInfo?.defaultUsername || 'admin' }}。
      </p>

      <div
        v-if="route.query.reason === 'not-configured' || !sessionInfo?.configured"
        class="mt-5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/12 dark:text-amber-200"
      >
        服务器还没有配置后台密码。先设置 `ADMIN_PASSWORD`，建议同时设置 `ADMIN_SESSION_SECRET`。
      </div>

      <div
        v-else-if="errorMessage"
        class="mt-5 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/12 dark:text-red-200"
      >
        {{ errorMessage }}
      </div>

      <form class="mt-6 space-y-4" @submit.prevent="signIn">
        <label class="block space-y-2">
          <span class="text-sm font-medium text-[var(--text-primary)]">用户名</span>
          <UiInput
            v-model="form.username"
            autocomplete="username"
            placeholder="admin"
            :disabled="submitting || !sessionInfo?.configured"
          />
        </label>

        <label class="block space-y-2">
          <span class="text-sm font-medium text-[var(--text-primary)]">密码</span>
          <UiInput
            v-model="form.password"
            type="password"
            autocomplete="current-password"
            placeholder="输入后台密码"
            :disabled="submitting || !sessionInfo?.configured"
          />
        </label>

        <UiButton class="mt-2 w-full" type="submit" :disabled="submitting || !sessionInfo?.configured">
          {{ submitting ? '登录中...' : '登录后台' }}
        </UiButton>
      </form>

      <div class="mt-6 flex items-center justify-between text-sm">
        <NuxtLink to="/" class="text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]">
          返回前台
        </NuxtLink>
        <UiButton variant="ghost" size="sm" @click="refresh">
          刷新状态
        </UiButton>
      </div>
    </UiCard>
  </main>
</template>
