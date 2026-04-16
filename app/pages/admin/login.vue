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
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),_transparent_38%),linear-gradient(180deg,_rgba(255,255,255,0.9),_rgba(255,255,255,1))] dark:bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_32%),linear-gradient(180deg,_rgba(8,15,30,0.96),_rgba(2,6,23,1))]" />
    <div class="absolute inset-x-0 top-0 h-px bg-black/10 dark:bg-white/10" />

    <UiCard class="relative w-full max-w-md p-7 sm:p-8">
      <p class="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--text-secondary)]">
        Mayday CMS
      </p>
      <h1 class="mt-4 text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
        后台登录
      </h1>
      <p class="mt-2 text-sm leading-7 text-[var(--text-secondary)]">
        后台接口现在要求登录态。默认用户名是 {{ sessionInfo?.defaultUsername || 'admin' }}，也可以通过 `ADMIN_USERNAME` 自定义。
      </p>

      <div
        v-if="route.query.reason === 'not-configured' || !sessionInfo?.configured"
        class="mt-5 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
      >
        服务器还没有配置后台密码。先设置 `ADMIN_PASSWORD`，建议同时设置 `ADMIN_SESSION_SECRET`。
      </div>

      <div
        v-else-if="errorMessage"
        class="mt-5 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
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

        <UiButton class="w-full" type="submit" :disabled="submitting || !sessionInfo?.configured">
          {{ submitting ? '登录中...' : '登录后台' }}
        </UiButton>
      </form>

      <div class="mt-6 flex items-center justify-between text-sm">
        <NuxtLink to="/" class="text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]">
          返回前台
        </NuxtLink>
        <UiButton variant="ghost" size="sm" @click="refresh">
          刷新状态
        </UiButton>
      </div>
    </UiCard>
  </main>
</template>
