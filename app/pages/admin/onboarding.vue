<script setup lang="ts">
definePageMeta({
  layout: false,
})

useSeoMeta({
  title: '首次部署向导',
  description: '按步骤完成数据库和管理员初始化。',
})

interface SetupStateResponse {
  databaseConfigured: boolean
  authConfigured: boolean
  databaseSource: 'env' | 'file' | 'missing'
  authSource: 'env' | 'file' | 'missing'
  defaultUsername: string
  sessionSecretConfigured: boolean
  setupComplete: boolean
  requiresDatabaseSetup: boolean
  requiresAdminSetup: boolean
  databaseHost: string | null
  databasePort: number | null
}

interface SetupConnectionTestResponse {
  ok: boolean
  databaseName: string
  currentUser: string
}

type WizardStepKey = 'address' | 'database' | 'admin'

const { data, pending, refresh, error } = await useFetch<SetupStateResponse>('/api/admin/setup')

const submitting = ref(false)
const testingConnection = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const currentStepIndex = ref(0)

const form = reactive({
  databaseHost: '127.0.0.1',
  databasePort: '5432',
  databaseName: '',
  databaseUsername: 'postgres',
  databasePassword: '',
  databaseSsl: false,
  adminUsername: 'admin',
  adminPassword: '',
  adminPasswordConfirm: '',
})

const requiresDatabaseSetup = computed(() => data.value?.requiresDatabaseSetup ?? true)
const requiresAdminSetup = computed(() => data.value?.requiresAdminSetup ?? true)

const inferredDatabaseMode = computed<'local' | 'remote'>(() => {
  const host = form.databaseHost.trim().toLowerCase()
  return ['localhost', '127.0.0.1', '::1'].includes(host) ? 'local' : 'remote'
})

const steps = computed(() => {
  const value: Array<{ key: WizardStepKey; title: string; description: string }> = []

  if (requiresDatabaseSetup.value) {
    value.push(
      {
        key: 'address',
        title: '连接地址',
        description: '填写数据库主机和端口。',
      },
      {
        key: 'database',
        title: '数据库信息',
        description: '填写数据库名称、账号和密码。',
      },
    )
  }

  if (requiresAdminSetup.value) {
    value.push({
      key: 'admin',
      title: '管理员账号',
      description: '设置后台管理员用户名和密码。',
    })
  }

  return value
})

const currentStep = computed(() => steps.value[currentStepIndex.value] || null)
const isLastStep = computed(() => currentStepIndex.value >= steps.value.length - 1)
const isBusy = computed(() => submitting.value || testingConnection.value)

watchEffect(() => {
  if (data.value?.defaultUsername) {
    form.adminUsername = data.value.defaultUsername
  }

  if (data.value?.databaseHost) {
    form.databaseHost = data.value.databaseHost
  }

  if (data.value?.databasePort) {
    form.databasePort = String(data.value.databasePort)
  }

  if (data.value?.setupComplete) {
    navigateTo('/admin')
  }
})

watchEffect(() => {
  const maxIndex = Math.max(steps.value.length - 1, 0)

  if (currentStepIndex.value > maxIndex) {
    currentStepIndex.value = maxIndex
  }
})

watch(inferredDatabaseMode, (mode) => {
  form.databaseSsl = mode === 'remote'
}, { immediate: true })

watch(() => [
  form.databaseHost,
  form.databasePort,
  form.databaseName,
  form.databaseUsername,
  form.databasePassword,
  form.databaseSsl,
], () => {
  successMessage.value = ''
})

function setError(message: string) {
  errorMessage.value = message
  successMessage.value = ''
}

function getRequestErrorMessage(requestError: unknown, fallbackMessage: string) {
  if (typeof requestError !== 'object' || requestError === null) {
    return fallbackMessage
  }

  if ('data' in requestError && typeof requestError.data === 'object' && requestError.data && 'statusMessage' in requestError.data && typeof requestError.data.statusMessage === 'string') {
    return requestError.data.statusMessage
  }

  if ('statusMessage' in requestError && typeof requestError.statusMessage === 'string') {
    return requestError.statusMessage
  }

  if ('message' in requestError && typeof requestError.message === 'string') {
    return requestError.message
  }

  return fallbackMessage
}

function buildSetupRequestBody(options: { dryRun?: boolean } = {}) {
  return {
    dryRun: options.dryRun,
    databaseMode: inferredDatabaseMode.value,
    databaseHost: form.databaseHost,
    databasePort: form.databasePort,
    databaseName: form.databaseName,
    databaseUsername: form.databaseUsername,
    databasePassword: form.databasePassword,
    databaseSsl: form.databaseSsl,
    adminUsername: form.adminUsername,
    adminPassword: form.adminPassword,
  }
}

function validateAddressStep() {
  if (!form.databaseHost.trim()) {
    setError('请先输入数据库主机地址。')
    return false
  }

  if (!form.databasePort.trim()) {
    setError('请先输入数据库端口。')
    return false
  }

  const databasePort = Number.parseInt(form.databasePort.trim(), 10)

  if (!/^\d+$/.test(form.databasePort.trim()) || databasePort < 1 || databasePort > 65535) {
    setError('请输入有效的数据库端口（1-65535）。')
    return false
  }

  return true
}

function validateDatabaseStep() {
  if (!form.databaseName.trim()) {
    setError('请先输入数据库名称。')
    return false
  }

  if (!form.databaseUsername.trim()) {
    setError('请先输入数据库用户名。')
    return false
  }

  if (!form.databasePassword) {
    setError('请先输入数据库密码。')
    return false
  }

  return true
}

function validateAdminStep() {
  if (!form.adminUsername.trim()) {
    setError('请先输入管理员用户名。')
    return false
  }

  if (!form.adminPassword) {
    setError('请设置后台登录密码。')
    return false
  }

  if (form.adminPassword.length < 8) {
    setError('后台密码至少需要 8 位。')
    return false
  }

  if (form.adminPassword !== form.adminPasswordConfirm) {
    setError('两次输入的密码不一致。')
    return false
  }

  return true
}

function validateStep(stepKey: WizardStepKey) {
  errorMessage.value = ''

  if (stepKey === 'address') {
    return validateAddressStep()
  }

  if (stepKey === 'database') {
    return validateDatabaseStep()
  }

  if (stepKey === 'admin') {
    return validateAdminStep()
  }

  return true
}

function validateDatabaseConnection() {
  errorMessage.value = ''
  return validateAddressStep() && validateDatabaseStep()
}

function goNext() {
  if (!currentStep.value) {
    return
  }

  if (!validateStep(currentStep.value.key)) {
    return
  }

  currentStepIndex.value += 1
}

function goBack() {
  errorMessage.value = ''

  if (currentStepIndex.value > 0) {
    currentStepIndex.value -= 1
  }
}

async function testConnection() {
  if (!validateDatabaseConnection()) {
    return
  }

  errorMessage.value = ''
  successMessage.value = ''
  testingConnection.value = true

  try {
    const result = await $fetch<SetupConnectionTestResponse>('/api/admin/setup', {
      method: 'POST',
      body: buildSetupRequestBody({ dryRun: true }),
    })

    successMessage.value = `连接成功，已验证数据库 ${result.databaseName}（用户 ${result.currentUser}）。`
  } catch (connectionError: unknown) {
    errorMessage.value = getRequestErrorMessage(connectionError, '测试连接失败，请检查配置后重试。')
  } finally {
    testingConnection.value = false
  }
}

async function submitSetup() {
  if (!requiresDatabaseSetup.value && !requiresAdminSetup.value) {
    return
  }

  if (currentStep.value && !validateStep(currentStep.value.key)) {
    return
  }

  errorMessage.value = ''
  successMessage.value = ''
  submitting.value = true

  try {
    await $fetch('/api/admin/setup', {
      method: 'POST',
      body: buildSetupRequestBody(),
    })

    successMessage.value = '初始化完成，正在进入后台...'
    await refresh()
    await navigateTo('/admin')
  } catch (setupError: unknown) {
    errorMessage.value = typeof setupError === 'object' && setupError && 'message' in setupError
      ? String((setupError as { message?: string }).message)
      : '初始化失败，请检查配置后重试。'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <main class="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
    <div
      class="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.08),_transparent_34%),linear-gradient(180deg,_rgba(255,255,255,0.92),_rgba(255,255,255,1))] dark:bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.14),_transparent_30%),linear-gradient(180deg,_rgba(8,15,30,0.96),_rgba(2,6,23,1))]" />
    <div
      class="absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,rgba(15,23,42,0.03)_50%,transparent_100%)] dark:bg-[linear-gradient(135deg,transparent_0%,rgba(255,255,255,0.04)_50%,transparent_100%)]" />

    <UiCard
      class="relative w-full max-w-3xl border border-[var(--border)] bg-[var(--card)]/95 p-7 shadow-[0_40px_120px_-60px_rgba(15,23,42,0.45)] backdrop-blur sm:p-9">
      <p class="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--text-secondary)]">
        First Deploy
      </p>
      <h1 class="mt-4 text-3xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-4xl">
        配置初始化
      </h1>

      <div
v-if="error"
        class="mt-6 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
        {{ error.message }}
      </div>

      <div
v-else-if="errorMessage"
        class="mt-6 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
        {{ errorMessage }}
      </div>

      <div
v-else-if="successMessage"
        class="mt-6 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
        {{ successMessage }}
      </div>

      <div v-if="steps.length" class="mt-8 grid gap-3 sm:grid-cols-3">
        <button
v-for="(step, index) in steps" :key="step.key" type="button"
          class="rounded-2xl border px-4 py-4 text-left transition" :class="index === currentStepIndex
            ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
            : index < currentStepIndex
              ? 'border-emerald-400 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200'
              : 'border-[var(--border)] bg-transparent text-[var(--text-primary)]'">
          <span class="block text-xs font-semibold uppercase tracking-[0.2em] opacity-70">
            Step {{ index + 1 }}
          </span>
          <span class="mt-2 block text-sm font-semibold">
            {{ step.title }}
          </span>
        </button>
      </div>

      <form v-if="currentStep" class="mt-8 space-y-6" @submit.prevent="isLastStep ? submitSetup() : goNext()">
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">
            {{ currentStep.title }}
          </p>
          <p class="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            {{ currentStep.description }}
          </p>
        </div>

        <div v-if="currentStep.key === 'address'" class="space-y-5">
          <div class="grid gap-4 sm:grid-cols-2">
            <label class="block space-y-2">
              <span class="text-sm font-medium text-[var(--text-primary)]">
                数据库主机
              </span>
              <UiInput
v-model="form.databaseHost" :disabled="submitting" placeholder="127.0.0.1 或 db.example.com"
                autocomplete="off" spellcheck="false" />
            </label>

            <label class="block space-y-2">
              <span class="text-sm font-medium text-[var(--text-primary)]">
                端口
              </span>
              <UiInput
v-model="form.databasePort" :disabled="submitting" placeholder="5432" autocomplete="off"
                inputmode="numeric" />
            </label>
          </div>
          <label class="flex items-start gap-3 rounded-2xl border border-[var(--border)] px-4 py-4">
            <UiCheckbox
v-model="form.databaseSsl" :disabled="submitting || inferredDatabaseMode === 'local'"
              class="mt-0.5" />
            <span>
              <span class="block text-sm font-medium text-[var(--text-primary)]">
                启用 SSL
              </span>
              <span class="block text-sm leading-6 text-[var(--text-secondary)]">
                远程数据库默认启用，连接信息会在服务器端加密保存。
              </span>
            </span>
          </label>
        </div>

        <div v-else-if="currentStep.key === 'database'" class="space-y-5">
          <label class="block space-y-2">
            <span class="text-sm font-medium text-[var(--text-primary)]">
              数据库名称
            </span>
            <UiInput
v-model="form.databaseName" :disabled="submitting" placeholder="mayday" autocomplete="off"
              spellcheck="false" />
          </label>

          <div class="grid gap-4 sm:grid-cols-2">
            <label class="block space-y-2">
              <span class="text-sm font-medium text-[var(--text-primary)]">
                数据库用户名
              </span>
              <UiInput
v-model="form.databaseUsername" :disabled="submitting" placeholder="postgres"
                autocomplete="username" />
            </label>

            <label class="block space-y-2">
              <span class="text-sm font-medium text-[var(--text-primary)]">
                数据库密码
              </span>
              <UiInput
v-model="form.databasePassword" type="password" :disabled="submitting" placeholder="输入数据库密码"
                autocomplete="new-password" />
            </label>
          </div>

        </div>

        <div v-else class="space-y-5">
          <div class="grid gap-4 sm:grid-cols-2">
            <label class="block space-y-2">
              <span class="text-sm font-medium text-[var(--text-primary)]">
                管理员用户名
              </span>
              <UiInput
v-model="form.adminUsername" :disabled="submitting" autocomplete="username"
                placeholder="admin" />
            </label>

            <div
              class="rounded-2xl border border-[var(--border)] bg-black/[0.03] px-4 py-3 text-sm leading-6 text-[var(--text-secondary)] dark:bg-white/[0.04]">
              完成后管理员密码只保存哈希值，后续请直接通过登录页进入后台。
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <label class="block space-y-2">
              <span class="text-sm font-medium text-[var(--text-primary)]">
                管理员密码
              </span>
              <UiInput
v-model="form.adminPassword" type="password" :disabled="submitting" autocomplete="new-password"
                placeholder="至少 8 位" />
            </label>

            <label class="block space-y-2">
              <span class="text-sm font-medium text-[var(--text-primary)]">
                确认密码
              </span>
              <UiInput
v-model="form.adminPasswordConfirm" type="password" :disabled="submitting"
                autocomplete="new-password" placeholder="再次输入密码" />
            </label>
          </div>

          <div
            class="rounded-2xl border border-[var(--border)] bg-black/[0.03] px-4 py-4 text-sm leading-6 text-[var(--text-secondary)] dark:bg-white/[0.04]">
            <p>你即将创建以下配置：</p>
            <p class="mt-2">数据库：{{ inferredDatabaseMode === 'local' ? '本地 PostgreSQL' : '远程 PostgreSQL' }}</p>
            <p>地址：{{ form.databaseHost }}:{{ form.databasePort }}</p>
            <p>库名：{{ form.databaseName || '未填写' }}</p>
            <p>管理员：{{ form.adminUsername || 'admin' }}</p>
          </div>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-5">
          <UiButton type="button" variant="outline" :disabled="submitting || currentStepIndex === 0" @click="goBack">
            上一步
          </UiButton>

          <div class="flex flex-wrap gap-3">
            <UiButton type="button" variant="ghost" :disabled="pending || submitting" @click="refresh">
              测试连接
            </UiButton>
            <UiButton v-if="!isLastStep" type="submit" :disabled="submitting">
              下一步
            </UiButton>
            <UiButton v-else type="submit" :disabled="submitting || (!requiresDatabaseSetup && !requiresAdminSetup)">
              {{ submitting ? '初始化中...' : '完成初始化' }}
            </UiButton>
          </div>
        </div>
      </form>
    </UiCard>
  </main>
</template>
