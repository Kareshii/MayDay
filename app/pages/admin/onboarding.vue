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

type WizardStepKey = 'database' | 'admin'

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
    value.push({
      key: 'database',
      title: '数据库信息',
      description: '在同一页填写主机、端口、库名、账号和密码。',
    })
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

function buildSetupRequestBody() {
  return {
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

function validateDatabaseCredentials() {
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

function validateDatabaseStep() {
  return validateAddressStep() && validateDatabaseCredentials()
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

  if (stepKey === 'database') {
    return validateDatabaseStep()
  }

  if (stepKey === 'admin') {
    return validateAdminStep()
  }

  return true
}

function goToStep(index: number) {
  if (index === currentStepIndex.value) {
    return
  }

  if (index > currentStepIndex.value && currentStep.value && !validateStep(currentStep.value.key)) {
    return
  }

  currentStepIndex.value = index
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
  if (!validateDatabaseStep()) {
    return
  }

  errorMessage.value = ''
  successMessage.value = ''
  testingConnection.value = true

  try {
    const result = await $fetch<SetupConnectionTestResponse>('/api/admin/setup', {
      method: 'POST',
      body: {
        ...buildSetupRequestBody(),
        dryRun: true,
      },
    })

    successMessage.value = `连接成功，已验证数据库 ${result.databaseName}（用户 ${result.currentUser}）。`
  } catch (connectionError: unknown) {
    errorMessage.value = typeof connectionError === 'object' && connectionError && 'message' in connectionError
      ? String((connectionError as { message?: string }).message)
      : '测试连接失败，请检查配置后重试。'
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
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,95,184,0.15),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(92,0,202,0.13),transparent_36%)]" />
    <div class="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.58),rgba(255,255,255,0))] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0))]" />

    <UiCard class="relative w-full max-w-3xl border border-[var(--border-soft)] bg-[var(--surface-card)]/95 p-7 sm:p-9">
      <p class="cms-kicker">
        First Deploy
      </p>
      <h1 class="mt-4 text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">
        配置初始化
      </h1>
      <p class="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
        按步骤完成数据库与管理员配置，结束后可直接进入后台。
      </p>

      <div class="mt-8 space-y-8">
      <div
        v-if="error"
        class="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/12 dark:text-red-200"
      >
        {{ error.message }}
      </div>

      <div
        v-else-if="errorMessage"
        class="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/12 dark:text-red-200"
      >
        {{ errorMessage }}
      </div>

      <div
        v-else-if="successMessage"
        class="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/12 dark:text-emerald-200"
      >
        {{ successMessage }}
      </div>

      <div
        v-if="steps.length"
        class="grid gap-3"
        :class="steps.length === 1 ? 'sm:grid-cols-1' : 'sm:grid-cols-2'"
      >
        <button
          v-for="(step, index) in steps"
          :key="step.key"
          type="button"
          class="cursor-pointer rounded-xl border px-4 py-4 text-left transition"
          :class="index === currentStepIndex
            ? 'border-transparent bg-[var(--primary)] text-white'
            : index < currentStepIndex
              ? 'border-transparent bg-[var(--primary-soft)] text-[var(--primary)]'
              : 'border-[var(--border-soft)] bg-[var(--surface-low)] text-[var(--text-primary)]'"
          @click="goToStep(index)"
        >
          <span class="block text-xs font-semibold uppercase tracking-[0.2em] opacity-75">
            Step {{ index + 1 }}
          </span>
          <span class="mt-2 block text-sm font-semibold">
            {{ step.title }}
          </span>
        </button>
      </div>

      <form v-if="currentStep" class="space-y-6" @submit.prevent="isLastStep ? submitSetup() : goNext()">
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">
            {{ currentStep.title }}
          </p>
          <p class="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            {{ currentStep.description }}
          </p>
        </div>

        <div v-if="currentStep.key === 'database'" class="space-y-5">
          <div class="grid gap-4 sm:grid-cols-2">
            <label class="block space-y-2">
              <span class="text-sm font-medium text-[var(--text-primary)]">
                数据库主机
              </span>
              <UiInput
                v-model="form.databaseHost"
                :disabled="submitting"
                placeholder="127.0.0.1 或 db.example.com"
                autocomplete="off"
                spellcheck="false"
              />
            </label>

            <label class="block space-y-2">
              <span class="text-sm font-medium text-[var(--text-primary)]">
                端口
              </span>
              <UiInput
                v-model="form.databasePort"
                :disabled="submitting"
                placeholder="5432"
                autocomplete="off"
                inputmode="numeric"
              />
            </label>
          </div>

          <label class="block space-y-2">
            <span class="text-sm font-medium text-[var(--text-primary)]">
              数据库名称
            </span>
            <UiInput
              v-model="form.databaseName"
              :disabled="submitting"
              placeholder="mayday"
              autocomplete="off"
              spellcheck="false"
            />
          </label>

          <div class="grid gap-4 sm:grid-cols-2">
            <label class="block space-y-2">
              <span class="text-sm font-medium text-[var(--text-primary)]">
                数据库用户名
              </span>
              <UiInput
                v-model="form.databaseUsername"
                :disabled="submitting"
                placeholder="postgres"
                autocomplete="username"
              />
            </label>

            <label class="block space-y-2">
              <span class="text-sm font-medium text-[var(--text-primary)]">
                数据库密码
              </span>
              <UiInput
                v-model="form.databasePassword"
                type="password"
                :disabled="submitting"
                placeholder="输入数据库密码"
                autocomplete="new-password"
              />
            </label>
          </div>

          <label class="flex items-start gap-3 rounded-xl border border-[var(--border-soft)] bg-[var(--surface-low)] px-4 py-4">
            <UiCheckbox
              v-model="form.databaseSsl"
              :disabled="submitting || inferredDatabaseMode === 'local'"
              class="mt-0.5"
            />
            <span>
              <span class="block text-sm font-medium text-[var(--text-primary)]">
                启用 SSL
              </span>
              <span class="block text-sm leading-6 text-[var(--text-secondary)]">
                远程数据库默认启用，连接信息会在服务器端加密保存。
              </span>
            </span>
          </label>

          <div
            class="rounded-xl border border-[var(--border-soft)] bg-[var(--surface-low)] px-4 py-4 text-sm leading-6 text-[var(--text-secondary)]"
          >
            <p>即将连接：{{ inferredDatabaseMode === 'local' ? '本地 PostgreSQL' : '远程 PostgreSQL' }}</p>
            <p>地址：{{ form.databaseHost || '未填写' }}:{{ form.databasePort || '未填写' }}</p>
            <p>库名：{{ form.databaseName || '未填写' }}</p>
            <p>用户：{{ form.databaseUsername || '未填写' }}</p>
          </div>
        </div>

        <div v-else class="space-y-5">
          <div class="grid gap-4 sm:grid-cols-2">
            <label class="block space-y-2">
              <span class="text-sm font-medium text-[var(--text-primary)]">
                管理员用户名
              </span>
              <UiInput
                v-model="form.adminUsername"
                :disabled="submitting"
                autocomplete="username"
                placeholder="admin"
              />
            </label>

            <div
              class="rounded-xl border border-[var(--border-soft)] bg-[var(--surface-low)] px-4 py-3 text-sm leading-6 text-[var(--text-secondary)]"
            >
              完成后管理员密码只保存哈希值，后续请直接通过登录页进入后台。
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <label class="block space-y-2">
              <span class="text-sm font-medium text-[var(--text-primary)]">
                管理员密码
              </span>
              <UiInput
                v-model="form.adminPassword"
                type="password"
                :disabled="submitting"
                autocomplete="new-password"
                placeholder="至少 8 位"
              />
            </label>

            <label class="block space-y-2">
              <span class="text-sm font-medium text-[var(--text-primary)]">
                确认密码
              </span>
              <UiInput
                v-model="form.adminPasswordConfirm"
                type="password"
                :disabled="submitting"
                autocomplete="new-password"
                placeholder="再次输入密码"
              />
            </label>
          </div>

          <div
            class="rounded-xl border border-[var(--border-soft)] bg-[var(--surface-low)] px-4 py-4 text-sm leading-6 text-[var(--text-secondary)]"
          >
            <p>你即将创建以下配置：</p>
            <p class="mt-2">数据库：{{ inferredDatabaseMode === 'local' ? '本地 PostgreSQL' : '远程 PostgreSQL' }}</p>
            <p>地址：{{ form.databaseHost }}:{{ form.databasePort }}</p>
            <p>库名：{{ form.databaseName || '未填写' }}</p>
            <p>管理员：{{ form.adminUsername || 'admin' }}</p>
          </div>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-soft)] pt-5">
          <UiButton type="button" variant="outline" :disabled="submitting || currentStepIndex === 0" @click="goBack">
            上一步
          </UiButton>

          <div class="flex flex-wrap gap-3">
            <UiButton
              v-if="currentStep.key === 'database'"
              type="button"
              variant="ghost"
              :disabled="pending || submitting || testingConnection"
              @click="testConnection"
            >
              {{ testingConnection ? '测试中...' : '测试连接' }}
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
      </div>
    </UiCard>
  </main>
</template>
