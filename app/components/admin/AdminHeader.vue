<script setup lang="ts">
const loggingOut = ref(false)
const headerMounted = ref(false)
const route = useRoute()
const colorMode = useColorMode()
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
const headerSearch = computed(() => headerMounted.value ? adminHeaderState.value.search : null)
const headerActions = computed(() => headerMounted.value ? adminHeaderState.value.actions : [])
const desktopVisibleActions = computed(() => headerActions.value.length >= 4
  ? headerActions.value.slice(0, 2)
  : headerActions.value)
const desktopOverflowActions = computed(() => headerActions.value.length >= 4
  ? headerActions.value.slice(2)
  : [])
const mobileVisibleActions = computed(() => headerActions.value.slice(0, 1))
const mobileOverflowActions = computed(() => headerActions.value.slice(1))
const isDarkMode = computed(() => colorMode.value === 'dark')
const themeToggleLabel = computed(() => isDarkMode.value ? '切换到亮色' : '切换到暗色')

interface AdminBreadcrumb {
  label: string
  to?: string
}

const breadcrumbs = computed<AdminBreadcrumb[]>(() => {
  const title = headerTitle.value
  const path = route.path

  if (path === '/admin') {
    return [{ label: title || '仪表盘' }]
  }

  if (path.startsWith('/admin/articles')) {
    const items: AdminBreadcrumb[] = [
      { label: '内容管理', to: '/admin/articles' },
      { label: '文章管理', to: path === '/admin/articles' ? undefined : '/admin/articles' },
    ]

    if (path !== '/admin/articles') {
      items.push({ label: title || (path.endsWith('/new') ? '新建文章' : '编辑文章') })
    }

    return items
  }

  const contentRoutes: Record<string, string> = {
    '/admin/content-images': '内容图片',
    '/admin/gallery': '图册管理',
    '/admin/features/categories': '分类管理',
    '/admin/features/comments': '评论管理',
  }

  if (contentRoutes[path]) {
    return [
      { label: '内容管理', to: '/admin/articles' },
      { label: title || contentRoutes[path] },
    ]
  }

  if (path.startsWith('/admin/features/site')) {
    const siteRouteLabels: Record<string, string> = {
      '/admin/features/site': '全局设置',
      '/admin/features/site/seo': 'SEO 设置',
      '/admin/features/site/navigation': '导航设置',
      '/admin/features/site/routes': '路由管理',
      '/admin/features/site/content': '内容设置',
      '/admin/features/site/account': '账号设置',
    }

    return [
      { label: '站点设置', to: path === '/admin/features/site' ? undefined : '/admin/features/site' },
      { label: title || siteRouteLabels[path] || '设置' },
    ]
  }

  const singleRoutes: Record<string, string> = {
    '/admin/features/tools': '功能管理',
    '/admin/settings': '系统设置',
    '/admin/onboarding': '初始化设置',
  }

  return [{ label: title || singleRoutes[path] || '后台管理' }]
})

const adminUsername = computed(() => sessionInfo.value?.username || sessionInfo.value?.defaultUsername || 'admin')
const adminAvatarFallback = computed(() => {
  const normalized = adminUsername.value.trim()
  return normalized ? normalized.slice(0, 2).toLowerCase() : 'ad'
})

onMounted(() => {
  headerMounted.value = true
})

async function runAction(action: {
  to?: string
  disabled?: boolean
  onClick?: () => void | Promise<void>
}) {
  if (action.disabled) {
    return
  }

  if (action.to) {
    await navigateTo(action.to)
    return
  }

  await action.onClick?.()
}

async function updateSearch(value: string) {
  await headerSearch.value?.onUpdate(value)
}

function getActionKey(action: { label: string; to?: string }, index: number) {
  return `${action.to || action.label}-${index}`
}

async function signOut() {
  loggingOut.value = true

  try {
    await $fetch('/api/admin/logout', { method: 'POST' })
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

function toggleColorMode() {
  colorMode.preference = isDarkMode.value ? 'light' : 'dark'
}
</script>

<template>
  <header class="sticky top-0 z-30 border-b border-[var(--border-soft)] bg-[var(--surface-card)]">
    <div class="cms-admin-toolbar flex h-[var(--cms-toolbar-height)] w-full items-center justify-between">
      <div class="flex h-full min-w-0 flex-1 items-center overflow-hidden pe-14 ps-2 lg:ps-4">
        <UiTooltip>
          <UiTooltipTrigger as-child>
            <UiButton variant="ghost" size="icon-sm" class="mr-1 shrink-0 lg:hidden" aria-label="打开侧边栏" @click="emit('toggle')">
              <Icon name="lucide:menu" class="size-3.5" />
            </UiButton>
          </UiTooltipTrigger>
          <UiTooltipContent side="bottom">
            打开侧边栏
          </UiTooltipContent>
        </UiTooltip>

        <nav class="min-w-0 flex-1" aria-label="面包屑">
          <ol class="flex min-w-0 items-center gap-1.5 text-sm">
            <li v-for="(breadcrumb, index) in breadcrumbs" :key="`${breadcrumb.label}-${index}`" class="flex min-w-0 items-center gap-1.5">
              <Icon v-if="index > 0" name="lucide:chevron-right" class="size-3.5 shrink-0 text-[var(--text-muted)]" />
              <NuxtLink
                v-if="breadcrumb.to"
                :to="breadcrumb.to"
                class="truncate font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
              >
                {{ breadcrumb.label }}
              </NuxtLink>
              <h1 v-else class="truncate font-semibold text-[var(--text-primary)]" :aria-current="index === breadcrumbs.length - 1 ? 'page' : undefined">
                {{ breadcrumb.label }}
              </h1>
            </li>
          </ol>
        </nav>

        <UiLabel
          v-if="headerSearch"
          class="ml-5 hidden w-[min(22rem,34vw)] min-w-56 shrink-0 md:block"
          :aria-label="headerSearch.label || headerSearch.placeholder || '搜索'"
        >
          <UiInput
            :model-value="headerSearch.value"
            type="search"
            :placeholder="headerSearch.placeholder || '搜索...'"
            class="max-w-none"
            @update:model-value="updateSearch(String($event))"
          />
        </UiLabel>
      </div>

      <div class="flex h-full shrink-0 items-center justify-end gap-1.5 px-2 lg:px-4">
        <div v-if="headerActions.length" class="hidden items-center gap-1.5 md:flex">
          <template v-if="headerActions.length < 3">
            <UiButton
              v-for="(action, index) in desktopVisibleActions"
              :key="getActionKey(action, index)"
              size="sm"
              :variant="action.variant || 'default'"
              :disabled="action.disabled"
              @click="runAction(action)"
            >
              <Icon v-if="action.icon" :name="action.icon" class="size-3.5" />
              {{ action.label }}
            </UiButton>
          </template>

          <UiButtonGroup v-else>
            <UiButton
              v-for="(action, index) in desktopVisibleActions"
              :key="getActionKey(action, index)"
              size="sm"
              :variant="action.variant || 'default'"
              :disabled="action.disabled"
              @click="runAction(action)"
            >
              <Icon v-if="action.icon" :name="action.icon" class="size-3.5" />
              {{ action.label }}
            </UiButton>

            <UiDropdownMenu v-if="desktopOverflowActions.length">
              <UiDropdownMenuTrigger as-child>
                <UiButton size="sm" variant="outline" aria-label="更多操作">
                  <Icon name="lucide:ellipsis" class="size-4" />
                  更多
                </UiButton>
              </UiDropdownMenuTrigger>
              <UiDropdownMenuContent align="end">
                <template v-for="(action, index) in desktopOverflowActions" :key="getActionKey(action, index + 2)">
                  <UiDropdownMenuSeparator v-if="action.variant === 'destructive' && index > 0" />
                  <UiDropdownMenuItem
                    :disabled="action.disabled"
                    :variant="action.variant === 'destructive' ? 'destructive' : 'default'"
                    @select="runAction(action)"
                  >
                    <Icon v-if="action.icon" :name="action.icon" class="size-4" />
                    {{ action.label }}
                  </UiDropdownMenuItem>
                </template>
              </UiDropdownMenuContent>
            </UiDropdownMenu>
          </UiButtonGroup>
        </div>

        <UiTooltip>
          <UiTooltipTrigger as-child>
            <UiButton
              variant="ghost"
              size="icon"
              :aria-label="themeToggleLabel"
              @click="toggleColorMode"
            >
              <Icon :name="isDarkMode ? 'lucide:sun' : 'lucide:moon'" class="size-4" />
            </UiButton>
          </UiTooltipTrigger>
          <UiTooltipContent side="bottom">
            {{ themeToggleLabel }}
          </UiTooltipContent>
        </UiTooltip>

        <UiDropdownMenu>
          <UiTooltip>
            <UiTooltipTrigger as-child>
              <UiDropdownMenuTrigger as-child>
                <UiAvatar
                  as="button"
                  type="button"
                  class="size-10 cursor-pointer text-xs transition-colors hover:bg-[var(--surface-low)] data-[state=open]:bg-[var(--surface-low)]"
                  aria-label="打开管理员菜单"
                >
                  <UiAvatarFallback>{{ adminAvatarFallback }}</UiAvatarFallback>
                </UiAvatar>
              </UiDropdownMenuTrigger>
            </UiTooltipTrigger>
            <UiTooltipContent side="bottom">
              管理员菜单
            </UiTooltipContent>
          </UiTooltip>
          <UiDropdownMenuContent align="end" :side-offset="8">
            <UiDropdownMenuItem @select="openSite">
              <Icon name="lucide:external-link" class="size-4" />
              查看前台
            </UiDropdownMenuItem>
            <UiDropdownMenuItem @select="refreshAdminPage">
              <Icon name="lucide:refresh-cw" class="size-4" />
              刷新
            </UiDropdownMenuItem>
            <UiDropdownMenuSeparator />
            <UiDropdownMenuItem :disabled="loggingOut" variant="destructive" @select="signOut">
              <Icon name="lucide:log-out" class="size-4" />
              {{ loggingOut ? '退出中...' : '退出登录' }}
            </UiDropdownMenuItem>
          </UiDropdownMenuContent>
        </UiDropdownMenu>
      </div>
    </div>

    <div v-if="headerSearch || headerActions.length" class="space-y-2 border-t border-[var(--border-soft)] px-3 py-2 md:hidden">
      <UiLabel
        v-if="headerSearch"
        class="block w-full min-w-0"
        :aria-label="headerSearch.label || headerSearch.placeholder || '搜索'"
      >
        <UiInput
          :model-value="headerSearch.value"
          type="search"
          :placeholder="headerSearch.placeholder || '搜索...'"
          class="max-w-none"
          @update:model-value="updateSearch(String($event))"
        />
      </UiLabel>

      <UiButton
        v-if="headerActions.length === 1"
        size="sm"
        :variant="mobileVisibleActions[0]?.variant || 'default'"
        :disabled="mobileVisibleActions[0]?.disabled"
        @click="mobileVisibleActions[0] && runAction(mobileVisibleActions[0])"
      >
        <Icon v-if="mobileVisibleActions[0]?.icon" :name="mobileVisibleActions[0].icon" class="size-3.5" />
        {{ mobileVisibleActions[0]?.label }}
      </UiButton>

      <UiButtonGroup v-else-if="headerActions.length > 1" class="max-w-full">
        <UiButton
          v-for="(action, index) in mobileVisibleActions"
          :key="getActionKey(action, index)"
          size="sm"
          :variant="action.variant || 'default'"
          :disabled="action.disabled"
          @click="runAction(action)"
        >
          <Icon v-if="action.icon" :name="action.icon" class="size-3.5" />
          {{ action.label }}
        </UiButton>

        <UiDropdownMenu v-if="mobileOverflowActions.length">
          <UiDropdownMenuTrigger as-child>
            <UiButton size="sm" variant="outline" aria-label="更多操作">
              <Icon name="lucide:ellipsis" class="size-4" />
              更多
            </UiButton>
          </UiDropdownMenuTrigger>
          <UiDropdownMenuContent align="end">
            <template v-for="(action, index) in mobileOverflowActions" :key="getActionKey(action, index + 1)">
              <UiDropdownMenuSeparator v-if="action.variant === 'destructive' && index > 0" />
              <UiDropdownMenuItem
                :disabled="action.disabled"
                :variant="action.variant === 'destructive' ? 'destructive' : 'default'"
                @select="runAction(action)"
              >
                <Icon v-if="action.icon" :name="action.icon" class="size-4" />
                {{ action.label }}
              </UiDropdownMenuItem>
            </template>
          </UiDropdownMenuContent>
        </UiDropdownMenu>
      </UiButtonGroup>
    </div>
  </header>
</template>

<style scoped>
.cms-admin-toolbar {
  --cms-toolbar-height: 3.25rem;
}
</style>
