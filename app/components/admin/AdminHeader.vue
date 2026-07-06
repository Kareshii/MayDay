<script setup lang="ts">
const loggingOut = ref(false)
const headerMounted = ref(false)
const { adminHeaderState } = useAdminHeader()
const { showSuccessToast, showErrorToast } = useAdminToast()

const emit = defineEmits<{
  toggle: []
}>()

const headerTitle = computed(() => headerMounted.value ? adminHeaderState.value.title : '')
const headerSubtitle = computed(() => headerMounted.value ? adminHeaderState.value.subtitle : '')
const headerSearch = computed(() => headerMounted.value ? adminHeaderState.value.search : null)
const headerActions = computed(() => headerMounted.value ? adminHeaderState.value.actions : [])

onMounted(() => {
  headerMounted.value = true
})

async function runAction(action: { onClick?: () => void | Promise<void> }) {
  await action.onClick?.()
}

async function updateSearch(value: string) {
  await headerSearch.value?.onUpdate(value)
}

function getActionKey(action: { label: string; to?: string }, index: number) {
  return `${action.to || action.label}-${index}`
}

function getActionClasses(action: { variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' }) {
  const variants = {
    default: 'border-transparent bg-[var(--primary)] text-white shadow-none hover:bg-[var(--primary-strong)]',
    secondary: 'border-transparent bg-[var(--surface-high)] text-[var(--text-primary)] hover:bg-[var(--surface-highest)]',
    outline: 'border-[var(--border-soft)] bg-[var(--surface-card)] text-[var(--text-primary)] hover:bg-[var(--surface-low)]',
    ghost: 'border-transparent bg-transparent text-[var(--text-primary)] hover:bg-[var(--surface-low)]',
    destructive: 'border-transparent bg-red-600 text-white shadow-none hover:bg-red-500',
  }

  return variants[action.variant || 'default']
}

async function signOut() {
  loggingOut.value = true

  try {
    await $fetch('/api/admin/logout', {
      method: 'POST',
    })

    await navigateTo('/admin/login')
  } catch (error) {
    showErrorToast('退出登录失败', getRequestErrorMessage(error, '退出登录失败'))
  } finally {
    loggingOut.value = false
  }
}

async function refreshAdminPage() {
  try {
    await refreshNuxtData()
    showSuccessToast('页面已刷新')
  } catch (error) {
    showErrorToast('刷新失败', getRequestErrorMessage(error, '刷新失败'))
  }
}

async function openSite() {
  await navigateTo('/')
}
</script>

<template>
  <header class="sticky top-0 z-30 border-b border-[var(--border-soft)] bg-[var(--surface-card)]">
    <div class="flex min-h-16 w-full flex-wrap items-center gap-3 px-4 py-3 lg:flex-nowrap lg:px-6">
      <UiButton variant="ghost" size="icon" class="lg:hidden" @click="emit('toggle')">
        <Icon name="lucide:menu" class="size-5" />
      </UiButton>

      <div class="min-w-0 flex-1">
        <h1 class="truncate text-base font-bold tracking-tight text-[var(--text-primary)] md:text-lg">
          {{ headerTitle }}
        </h1>
        <p v-if="headerSubtitle" class="hidden truncate text-xs text-[var(--text-secondary)] md:block">
          {{ headerSubtitle }}
        </p>
      </div>

      <label
        v-if="headerSearch"
        class="order-3 relative block w-full min-w-0 lg:order-none lg:w-80"
        :aria-label="headerSearch.label || headerSearch.placeholder || '搜索'"
      >
        <Icon name="lucide:search" class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--text-secondary)]" />
        <input
          :value="headerSearch.value"
          type="search"
          :placeholder="headerSearch.placeholder || '搜索...'"
          class="h-10 w-full rounded-md border border-[var(--border-soft)] bg-[var(--surface-low)] pl-10 pr-3 text-sm text-[var(--text-primary)] outline-none transition-all duration-300 placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:bg-[var(--surface-card)] focus:ring-2 focus:ring-[var(--focus-ring)]"
          @input="updateSearch(($event.target as HTMLInputElement).value)"
        >
      </label>

      <div v-if="headerActions.length" class="order-4 flex w-full min-w-0 flex-wrap items-center gap-2 lg:order-none lg:w-auto lg:justify-end">
        <template v-for="(action, index) in headerActions" :key="getActionKey(action, index)">
          <NuxtLink
            v-if="action.to"
            :to="action.to"
            class="inline-flex h-10 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md border px-4 py-2 text-sm font-semibold transition-all outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]"
            :class="[
              getActionClasses(action),
              action.disabled ? 'pointer-events-none opacity-50' : '',
            ]"
            :aria-disabled="action.disabled ? 'true' : undefined"
          >
            <Icon v-if="action.icon" :name="action.icon" class="size-4" />
            {{ action.label }}
          </NuxtLink>
          <UiButton
            v-else
            :variant="action.variant || 'default'"
            :disabled="action.disabled"
            @click="runAction(action)"
          >
            <Icon v-if="action.icon" :name="action.icon" class="size-4" />
            {{ action.label }}
          </UiButton>
        </template>
      </div>

      <div class="ml-auto flex shrink-0 items-center gap-2.5">
        <ColorModeSwitch class="text-[var(--text-primary)]" />
        <UiMenubar>
          <UiMenubarMenu value="admin-account">
            <UiMenubarTrigger as-child>
              <UiAvatar
                as="button"
                type="button"
                aria-label="打开管理员菜单"
                class="size-10 cursor-pointer transition-colors hover:bg-[var(--surface-low)] data-[state=open]:bg-[var(--surface-low)]"
              >
                <UiAvatarFallback>AD</UiAvatarFallback>
              </UiAvatar>
            </UiMenubarTrigger>
            <UiMenubarContent align="end" :side-offset="8">
              <UiMenubarItem text-value="查看前台" @select="openSite">
                <Icon name="lucide:external-link" class="size-4 text-[var(--text-secondary)]" />
                查看前台
              </UiMenubarItem>
              <UiMenubarItem text-value="刷新" @select="refreshAdminPage">
                <Icon name="lucide:refresh-cw" class="size-4 text-[var(--text-secondary)]" />
                刷新
              </UiMenubarItem>
              <UiMenubarSeparator />
              <UiMenubarItem :disabled="loggingOut" text-value="退出登录" @select="signOut">
                <Icon name="lucide:log-out" class="size-4 text-[var(--text-secondary)]" />
                {{ loggingOut ? '退出中...' : '退出登录' }}
              </UiMenubarItem>
            </UiMenubarContent>
          </UiMenubarMenu>
        </UiMenubar>
      </div>
    </div>
  </header>
</template>
