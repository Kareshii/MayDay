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
type SetupFieldKey = 'databaseHost' | 'databasePort' | 'databaseName' | 'databaseUsername' | 'databasePassword' | 'adminUsername' | 'adminPassword' | 'adminPasswordConfirm'

const { data, pending, refresh, error } = await useFetch<SetupStateResponse>('/api/admin/setup')

const submitting = ref(false)
const testingConnection = ref(false)
const currentStepIndex = ref(0)
const { showSuccessToast, showErrorToast, showWarningToast } = useAdminToast()

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
const fieldErrors = reactive<Record<SetupFieldKey, string>>({
  databaseHost: '',
  databasePort: '',
  databaseName: '',
  databaseUsername: '',
  databasePassword: '',
  adminUsername: '',
  adminPassword: '',
  adminPasswordConfirm: '',
})
const fieldIds: Record<SetupFieldKey, string> = {
  databaseHost: 'setup-database-host',
  databasePort: 'setup-database-port',
  databaseName: 'setup-database-name',
  databaseUsername: 'setup-database-username',
  databasePassword: 'setup-database-password',
  adminUsername: 'setup-admin-username',
  adminPassword: 'setup-admin-password',
  adminPasswordConfirm: 'setup-admin-password-confirm',
}

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

function setError(field: SetupFieldKey, message: string) {
  fieldErrors[field] = message
  showWarningToast('请完善配置', message)
  void nextTick(() => document.getElementById(fieldIds[field])?.focus())
}

for (const field of Object.keys(fieldErrors) as SetupFieldKey[]) {
  watch(() => form[field], () => {
    fieldErrors[field] = ''
  })
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
    setError('databaseHost', '请先输入数据库主机地址。')
    return false
  }

  if (!form.databasePort.trim()) {
    setError('databasePort', '请先输入数据库端口。')
    return false
  }

  const databasePort = Number.parseInt(form.databasePort.trim(), 10)

  if (!/^\d+$/.test(form.databasePort.trim()) || databasePort < 1 || databasePort > 65535) {
    setError('databasePort', '请输入有效的数据库端口（1-65535）。')
    return false
  }

  return true
}

function validateDatabaseCredentials() {
  if (!form.databaseName.trim()) {
    setError('databaseName', '请先输入数据库名称。')
    return false
  }

  if (!form.databaseUsername.trim()) {
    setError('databaseUsername', '请先输入数据库用户名。')
    return false
  }

  if (!form.databasePassword) {
    setError('databasePassword', '请先输入数据库密码。')
    return false
  }

  return true
}

function validateDatabaseStep() {
  return validateAddressStep() && validateDatabaseCredentials()
}

function validateAdminStep() {
  if (!form.adminUsername.trim()) {
    setError('adminUsername', '请先输入管理员用户名。')
    return false
  }

  if (!form.adminPassword) {
    setError('adminPassword', '请设置后台登录密码。')
    return false
  }

  if (form.adminPassword.length < 8) {
    setError('adminPassword', '后台密码至少需要 8 位。')
    return false
  }

  if (form.adminPassword !== form.adminPasswordConfirm) {
    setError('adminPasswordConfirm', '两次输入的密码不一致。')
    return false
  }

  return true
}

function validateStep(stepKey: WizardStepKey) {
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
  if (currentStepIndex.value > 0) {
    currentStepIndex.value -= 1
  }
}

async function testConnection() {
  if (!validateDatabaseStep()) {
    return
  }

  testingConnection.value = true

  try {
    const result = await $fetch<SetupConnectionTestResponse>('/api/admin/setup', {
      method: 'POST',
      body: {
        ...buildSetupRequestBody(),
        dryRun: true,
      },
    })

    showSuccessToast('连接成功', `已验证数据库 ${result.databaseName}（用户 ${result.currentUser}）。`)
  } catch (connectionError: unknown) {
    showErrorToast('测试连接失败', getRequestErrorMessage(connectionError, '测试连接失败，请检查配置后重试。'))
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

  submitting.value = true

  try {
    await $fetch('/api/admin/setup', {
      method: 'POST',
      body: buildSetupRequestBody(),
    })

    showSuccessToast('初始化完成', '正在进入后台...')
    await refresh()
    await navigateTo('/admin')
  } catch (setupError: unknown) {
    showErrorToast('初始化失败', getRequestErrorMessage(setupError, '初始化失败，请检查配置后重试。'))
  } finally {
    submitting.value = false
  }
}

watch(error, (value) => {
  if (value) {
    showErrorToast('初始化状态加载失败', value.message)
  }
}, { immediate: true })
</script>

<template>
  <main class="flex min-h-dvh items-center justify-center bg-[var(--bg-primary)] px-4 py-10">
    <UiCard class="w-full max-w-2xl p-7 sm:p-9">
      <p class="cms-kicker">
        First Deploy
      </p>
      <h1 class="mt-4 text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
        配置初始化
      </h1>
      <p class="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
        按步骤完成数据库与管理员配置，结束后可直接进入后台。
      </p>

      <div v-if="pending" class="mt-8 space-y-4" aria-label="正在加载初始化状态">
        <UiSkeleton class="h-12 w-full" />
        <UiSkeleton class="h-10 w-full" />
        <UiSkeleton class="h-10 w-full" />
        <UiSkeleton class="h-48 w-full" />
      </div>

      <UiAlert v-else-if="error" class="mt-8" variant="destructive">
        <Icon name="lucide:circle-alert" />
        <UiAlertTitle>初始化状态加载失败</UiAlertTitle>
        <UiAlertDescription>{{ error.message }}</UiAlertDescription>
        <UiAlertAction>
          <UiButton variant="outline" size="sm" @click="refresh">
            <Icon name="lucide:refresh-cw" class="size-4" />
            重试
          </UiButton>
        </UiAlertAction>
      </UiAlert>

      <div v-else class="mt-8 space-y-8">
        <div
          v-if="steps.length"
          class="grid gap-3"
          :class="steps.length === 1 ? 'sm:grid-cols-1' : 'sm:grid-cols-2'"
        >
          <UiButton
            v-for="(step, index) in steps"
            :key="step.key"
            type="button"
            :variant="index === currentStepIndex ? 'default' : index < currentStepIndex ? 'secondary' : 'outline'"
            class="w-full justify-start"
            @click="goToStep(index)"
          >
            <Icon :name="index < currentStepIndex ? 'lucide:circle-check' : 'lucide:circle'" class="size-4" />
            步骤 {{ index + 1 }} · {{ step.title }}
          </UiButton>
        </div>

      <form v-if="currentStep" class="max-w-2xl space-y-6" novalidate @submit.prevent="isLastStep ? submitSetup() : goNext()">
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">
            {{ currentStep.title }}
          </p>
          <p class="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            {{ currentStep.description }}
          </p>
        </div>

        <div v-if="currentStep.key === 'database'" class="space-y-5">
          <div class="grid gap-4">
            <UiLabel class="block space-y-2">
              <span class="text-sm font-medium text-[var(--text-primary)]">
                数据库主机 <span class="text-[var(--danger)]">*</span>
              </span>
              <UiInput
                id="setup-database-host"
                v-model="form.databaseHost"
                :disabled="submitting"
                placeholder="127.0.0.1 或 db.example.com"
                autocomplete="off"
                spellcheck="false"
                required
                :aria-invalid="Boolean(fieldErrors.databaseHost)"
                :aria-describedby="fieldErrors.databaseHost ? 'setup-database-host-error' : undefined"
              />
              <p v-if="fieldErrors.databaseHost" id="setup-database-host-error" class="text-xs text-[var(--danger)]" role="alert">
                {{ fieldErrors.databaseHost }}
              </p>
            </UiLabel>

            <UiLabel class="block space-y-2">
              <span class="text-sm font-medium text-[var(--text-primary)]">
                端口 <span class="text-[var(--danger)]">*</span>
              </span>
              <UiInput
                id="setup-database-port"
                v-model="form.databasePort"
                :disabled="submitting"
                placeholder="5432"
                autocomplete="off"
                inputmode="numeric"
                required
                :aria-invalid="Boolean(fieldErrors.databasePort)"
                :aria-describedby="fieldErrors.databasePort ? 'setup-database-port-error' : undefined"
              />
              <p v-if="fieldErrors.databasePort" id="setup-database-port-error" class="text-xs text-[var(--danger)]" role="alert">
                {{ fieldErrors.databasePort }}
              </p>
            </UiLabel>
          </div>

          <UiLabel class="block space-y-2">
            <span class="text-sm font-medium text-[var(--text-primary)]">
              数据库名称 <span class="text-[var(--danger)]">*</span>
            </span>
            <UiInput
              id="setup-database-name"
              v-model="form.databaseName"
              :disabled="submitting"
              placeholder="mayday"
              autocomplete="off"
              spellcheck="false"
              required
              :aria-invalid="Boolean(fieldErrors.databaseName)"
              :aria-describedby="fieldErrors.databaseName ? 'setup-database-name-error' : undefined"
            />
            <p v-if="fieldErrors.databaseName" id="setup-database-name-error" class="text-xs text-[var(--danger)]" role="alert">
              {{ fieldErrors.databaseName }}
            </p>
          </UiLabel>

          <div class="grid gap-4">
            <UiLabel class="block space-y-2">
              <span class="text-sm font-medium text-[var(--text-primary)]">
                数据库用户名 <span class="text-[var(--danger)]">*</span>
              </span>
              <UiInput
                id="setup-database-username"
                v-model="form.databaseUsername"
                :disabled="submitting"
                placeholder="postgres"
                autocomplete="username"
                required
                :aria-invalid="Boolean(fieldErrors.databaseUsername)"
                :aria-describedby="fieldErrors.databaseUsername ? 'setup-database-username-error' : undefined"
              />
              <p v-if="fieldErrors.databaseUsername" id="setup-database-username-error" class="text-xs text-[var(--danger)]" role="alert">
                {{ fieldErrors.databaseUsername }}
              </p>
            </UiLabel>

            <UiLabel class="block space-y-2">
              <span class="text-sm font-medium text-[var(--text-primary)]">
                数据库密码 <span class="text-[var(--danger)]">*</span>
              </span>
              <UiInput
                id="setup-database-password"
                v-model="form.databasePassword"
                type="password"
                :disabled="submitting"
                placeholder="输入数据库密码"
                autocomplete="new-password"
                required
                :aria-invalid="Boolean(fieldErrors.databasePassword)"
                :aria-describedby="fieldErrors.databasePassword ? 'setup-database-password-error' : undefined"
              />
              <p v-if="fieldErrors.databasePassword" id="setup-database-password-error" class="text-xs text-[var(--danger)]" role="alert">
                {{ fieldErrors.databasePassword }}
              </p>
            </UiLabel>
          </div>

          <UiLabel class="flex items-start gap-3 rounded-md border border-[var(--border-soft)] bg-[var(--surface-low)] px-4 py-4">
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
          </UiLabel>

          <UiAlert variant="info">
            <Icon name="lucide:database" />
            <UiAlertTitle>连接摘要</UiAlertTitle>
            <UiAlertDescription>
              <p>类型：{{ inferredDatabaseMode === 'local' ? '本地 PostgreSQL' : '远程 PostgreSQL' }}</p>
              <p>地址：{{ form.databaseHost || '未填写' }}:{{ form.databasePort || '未填写' }}</p>
              <p>库名：{{ form.databaseName || '未填写' }}</p>
              <p>用户：{{ form.databaseUsername || '未填写' }}</p>
            </UiAlertDescription>
          </UiAlert>
        </div>

        <div v-else class="space-y-5">
          <div class="grid gap-4">
            <UiLabel class="block space-y-2">
              <span class="text-sm font-medium text-[var(--text-primary)]">
                管理员用户名 <span class="text-[var(--danger)]">*</span>
              </span>
              <UiInput
                id="setup-admin-username"
                v-model="form.adminUsername"
                :disabled="submitting"
                autocomplete="username"
                placeholder="admin"
                required
                :aria-invalid="Boolean(fieldErrors.adminUsername)"
                :aria-describedby="fieldErrors.adminUsername ? 'setup-admin-username-error' : undefined"
              />
              <p v-if="fieldErrors.adminUsername" id="setup-admin-username-error" class="text-xs text-[var(--danger)]" role="alert">
                {{ fieldErrors.adminUsername }}
              </p>
            </UiLabel>

            <UiAlert variant="info">
              <Icon name="lucide:shield-check" />
              <UiAlertTitle>密码存储</UiAlertTitle>
              <UiAlertDescription>完成后管理员密码只保存哈希值，后续请直接通过登录页进入后台。</UiAlertDescription>
            </UiAlert>
          </div>

          <div class="grid gap-4">
            <UiLabel class="block space-y-2">
              <span class="text-sm font-medium text-[var(--text-primary)]">
                管理员密码 <span class="text-[var(--danger)]">*</span>
              </span>
              <UiInput
                id="setup-admin-password"
                v-model="form.adminPassword"
                type="password"
                :disabled="submitting"
                autocomplete="new-password"
                placeholder="至少 8 位"
                minlength="8"
                required
                :aria-invalid="Boolean(fieldErrors.adminPassword)"
                :aria-describedby="fieldErrors.adminPassword ? 'setup-admin-password-error' : undefined"
              />
              <p v-if="fieldErrors.adminPassword" id="setup-admin-password-error" class="text-xs text-[var(--danger)]" role="alert">
                {{ fieldErrors.adminPassword }}
              </p>
            </UiLabel>

            <UiLabel class="block space-y-2">
              <span class="text-sm font-medium text-[var(--text-primary)]">
                确认密码 <span class="text-[var(--danger)]">*</span>
              </span>
              <UiInput
                id="setup-admin-password-confirm"
                v-model="form.adminPasswordConfirm"
                type="password"
                :disabled="submitting"
                autocomplete="new-password"
                placeholder="再次输入密码"
                minlength="8"
                required
                :aria-invalid="Boolean(fieldErrors.adminPasswordConfirm)"
                :aria-describedby="fieldErrors.adminPasswordConfirm ? 'setup-admin-password-confirm-error' : undefined"
              />
              <p v-if="fieldErrors.adminPasswordConfirm" id="setup-admin-password-confirm-error" class="text-xs text-[var(--danger)]" role="alert">
                {{ fieldErrors.adminPasswordConfirm }}
              </p>
            </UiLabel>
          </div>

          <UiAlert variant="info">
            <Icon name="lucide:clipboard-check" />
            <UiAlertTitle>初始化摘要</UiAlertTitle>
            <UiAlertDescription>
              <p>数据库：{{ inferredDatabaseMode === 'local' ? '本地 PostgreSQL' : '远程 PostgreSQL' }}</p>
              <p>地址：{{ form.databaseHost }}:{{ form.databasePort }}</p>
              <p>库名：{{ form.databaseName || '未填写' }}</p>
              <p>管理员：{{ form.adminUsername || 'admin' }}</p>
            </UiAlertDescription>
          </UiAlert>
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
              <Icon v-if="testingConnection" name="lucide:loader-circle" class="size-4 animate-spin" />
              {{ testingConnection ? '测试中...' : '测试连接' }}
            </UiButton>
            <UiButton v-if="!isLastStep" type="submit" :disabled="submitting">
              下一步
            </UiButton>
            <UiButton v-else type="submit" :disabled="submitting || (!requiresDatabaseSetup && !requiresAdminSetup)">
              <Icon v-if="submitting" name="lucide:loader-circle" class="size-4 animate-spin" />
              {{ submitting ? '初始化中...' : '完成初始化' }}
            </UiButton>
          </div>
        </div>
      </form>
      </div>
    </UiCard>
  </main>
</template>
