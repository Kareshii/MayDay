<script setup lang="ts">
const loggingOut = ref(false)
const headerMounted = ref(false)
const { adminHeaderState } = useAdminHeader()
const { showSuccessToast, showErrorToast } = useAdminToast()
const { data: sessionInfo } = await useFetch<{
  username: string | null
  defaultUsername: string
}>('/api/admin/session')

const emit = defineEmits<{
  toggle: []
}>()

const headerTitle = computed(() => headerMounted.value ? adminHeaderState.value.title : '')
const headerSubtitle = computed(() => headerMounted.value ? adminHeaderState.value.subtitle : '')
const headerSearch = computed(() => headerMounted.value ? adminHeaderState.value.search : null)
const headerActions = computed(() => headerMounted.value ? adminHeaderState.value.actions : [])
const adminUsername = computed(() => sessionInfo.value?.username || sessionInfo.value?.defaultUsername || 'admin')
const adminAvatarFallback = computed(() => {
  const normalized = adminUsername.value.trim()

  if (!normalized) {
    return 'ad'
  }

  return normalized.slice(0, 2).toLowerCase()
})

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
    <div class="cms-admin-toolbar flex h-[var(--cms-toolbar-height)] w-full items-center justify-between">
      <div class="cms-admin-toolbar-left flex h-full min-w-0 flex-1 items-center overflow-hidden pe-14 ps-2 lg:ps-4">
        <UiButton variant="ghost" size="icon" class="mr-1 size-8 shrink-0 lg:hidden" @click="emit('toggle')">
          <Icon name="lucide:menu" class="size-3.5" />
        </UiButton>

        <div class="min-w-0 flex-1">
          <h1 class="truncate text-sm font-bold tracking-tight text-[var(--text-primary)] md:text-base">
            {{ headerTitle }}
          </h1>
          <p v-if="headerSubtitle" class="hidden truncate text-[11px] text-[var(--text-secondary)] md:block">
            {{ headerSubtitle }}
          </p>
        </div>

        <label
          v-if="headerSearch"
          class="relative ml-5 hidden w-[min(22rem,34vw)] min-w-56 shrink-0 md:block"
          :aria-label="headerSearch.label || headerSearch.placeholder || '搜索'"
        >
          <Icon name="lucide:search" class="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            :value="headerSearch.value"
            type="search"
            :placeholder="headerSearch.placeholder || '搜索...'"
            class="h-8 w-full rounded-md border border-[var(--border-soft)] bg-[var(--surface-low)] pl-8 pr-3 text-xs text-[var(--text-primary)] outline-none transition-all duration-300 placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:bg-[var(--surface-card)] focus:ring-2 focus:ring-[var(--focus-ring)]"
            @input="updateSearch(($event.target as HTMLInputElement).value)"
          >
        </label>
      </div>

      <div class="flex h-full shrink-0 items-center justify-end gap-1.5 px-2 lg:px-4">
        <div v-if="headerActions.length" class="hidden items-center gap-1.5 md:flex">
          <template v-for="(action, index) in headerActions" :key="getActionKey(action, index)">
            <NuxtLink
              v-if="action.to"
              :to="action.to"
              class="inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-md border px-2.5 text-xs font-semibold transition-all outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]"
              :class="[
                getActionClasses(action),
                action.disabled ? 'pointer-events-none opacity-50' : '',
              ]"
              :aria-disabled="action.disabled ? 'true' : undefined"
            >
              <Icon v-if="action.icon" :name="action.icon" class="size-3.5" />
              {{ action.label }}
            </NuxtLink>
            <UiButton
              v-else
              size="sm"
              class="h-8 gap-1.5 px-2.5 text-xs"
              :variant="action.variant || 'default'"
              :disabled="action.disabled"
              @click="runAction(action)"
            >
              <Icon v-if="action.icon" :name="action.icon" class="size-3.5" />
              {{ action.label }}
            </UiButton>
          </template>
        </div>

        <ColorModeSwitch class="text-[var(--text-primary)]" />
        <UiMenubar>
          <UiMenubarMenu value="admin-account">
            <UiMenubarTrigger as-child>
              <UiAvatar
                as="button"
                type="button"
                class="size-8 cursor-pointer text-xs transition-colors hover:bg-[var(--surface-low)] data-[state=open]:bg-[var(--surface-low)]"
              >
                <UiAvatarFallback>{{ adminAvatarFallback }}</UiAvatarFallback>
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

    <div v-if="headerSearch || headerActions.length" class="space-y-2 border-t border-[var(--border-soft)] px-3 py-2 md:hidden">
      <label
        v-if="headerSearch"
        class="relative block w-full min-w-0"
        :aria-label="headerSearch.label || headerSearch.placeholder || '搜索'"
      >
        <Icon name="lucide:search" class="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[var(--text-secondary)]" />
        <input
          :value="headerSearch.value"
          type="search"
          :placeholder="headerSearch.placeholder || '搜索...'"
          class="h-8 w-full rounded-md border border-[var(--border-soft)] bg-[var(--surface-low)] pl-8 pr-3 text-xs text-[var(--text-primary)] outline-none transition-all duration-300 placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:bg-[var(--surface-card)] focus:ring-2 focus:ring-[var(--focus-ring)]"
          @input="updateSearch(($event.target as HTMLInputElement).value)"
        >
      </label>

      <div v-if="headerActions.length" class="flex min-w-0 gap-1.5 overflow-x-auto pb-0.5">
        <template v-for="(action, index) in headerActions" :key="getActionKey(action, index)">
          <NuxtLink
            v-if="action.to"
            :to="action.to"
            class="inline-flex h-8 shrink-0 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-md border px-2.5 text-xs font-semibold transition-all outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]"
            :class="[
              getActionClasses(action),
              action.disabled ? 'pointer-events-none opacity-50' : '',
            ]"
            :aria-disabled="action.disabled ? 'true' : undefined"
          >
            <Icon v-if="action.icon" :name="action.icon" class="size-3.5" />
            {{ action.label }}
          </NuxtLink>
          <UiButton
            v-else
            size="sm"
            class="h-8 shrink-0 gap-1.5 px-2.5 text-xs"
            :variant="action.variant || 'default'"
            :disabled="action.disabled"
            @click="runAction(action)"
          >
            <Icon v-if="action.icon" :name="action.icon" class="size-3.5" />
            {{ action.label }}
          </UiButton>
        </template>
      </div>
    </div>
  </header>
</template>

<style scoped>
.cms-admin-toolbar {
  --cms-toolbar-height: 3.25rem;
}

.cms-admin-toolbar-left {
  mask-image: linear-gradient(to right, #000 0%, #000 calc(100% - 50px), transparent);
  -webkit-mask-image: linear-gradient(to right, #000 0%, #000 calc(100% - 50px), transparent);
}
</style>
