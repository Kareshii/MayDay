<script setup lang="ts">
const route = useRoute()

const props = defineProps<{
  mobileOpen: boolean
  collapsed: boolean
}>()

const emit = defineEmits<{
  close: []
  toggleCollapse: []
}>()

type NavItem = {
  title: string
  to: string
  icon: string
  children?: NavItem[]
}

const navItems: NavItem[] = [
  { title: '仪表盘', to: '/admin', icon: 'lucide:layout-dashboard' },
  {
    title: '内容管理',
    to: '/admin/articles',
    icon: 'lucide:folder-open',
    children: [
      {
        title: '文章管理',
        to: '/admin/articles',
        icon: 'lucide:file-text',
        children: [
          { title: '已发布', to: '/admin/articles?status=published', icon: 'lucide:badge-check' },
          { title: '草稿', to: '/admin/articles?status=draft', icon: 'lucide:file-pen-line' },
        ],
      },
      { title: '内容图片', to: '/admin/content-images', icon: 'lucide:image' },
      { title: '分类', to: '/admin/features/categories', icon: 'lucide:folder-tree' },
      { title: '评论', to: '/admin/features/comments', icon: 'lucide:message-square' },
    ],
  },
  {
    title: '站点设置',
    to: '/admin/features/site',
    icon: 'lucide:sliders-horizontal',
    children: [
      { title: '全局设置', to: '/admin/features/site', icon: 'lucide:globe-2' },
      { title: 'SEO 设置', to: '/admin/features/site/seo', icon: 'lucide:search' },
      { title: '导航设置', to: '/admin/features/site/navigation', icon: 'lucide:menu' },
      { title: '内容设置', to: '/admin/features/site/content', icon: 'lucide:image' },
      { title: '账号设置', to: '/admin/features/site/account', icon: 'lucide:shield-user' },
    ],
  },
  { title: '功能管理', to: '/admin/features/tools', icon: 'lucide:search-check' },
  { title: '设置', to: '/admin/settings', icon: 'lucide:settings-2' },
]

const expandedMenus = ref<Record<string, boolean>>({})

function parseTo(to: string) {
  const [path, queryString = ''] = to.split('?')
  const params = new URLSearchParams(queryString)

  return {
    path,
    status: params.get('status'),
  }
}

function isActive(to: string) {
  const target = parseTo(to)

  if (target.status) {
    return route.path === target.path && route.query.status === target.status
  }

  return target.path === '/admin'
    ? route.path === target.path
    : route.path === target.path || route.path.startsWith(`${target.path}/`)
}

function isGroupActive(item: NavItem): boolean {
  return isActive(item.to) || Boolean(item.children?.some(child => isGroupActive(child)))
}

function getItemKey(item: NavItem, parents: string[] = []) {
  return [...parents, item.title].join('/')
}

function collectActiveMenuKeys(items: NavItem[], parents: string[] = []) {
  const keys: string[] = []

  for (const item of items) {
    const nextParents = [...parents, item.title]

    if (item.children?.length) {
      if (isGroupActive(item)) {
        keys.push(getItemKey(item, parents))
      }

      keys.push(...collectActiveMenuKeys(item.children, nextParents))
    }
  }

  return keys
}

function toggleMenu(key: string) {
  expandedMenus.value = {
    ...expandedMenus.value,
    [key]: !expandedMenus.value[key],
  }
}

watch(
  () => route.fullPath,
  () => {
    const next = { ...expandedMenus.value }

    for (const key of collectActiveMenuKeys(navItems)) {
      next[key] = true
    }

    expandedMenus.value = next
  },
  { immediate: true },
)
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="props.mobileOpen"
      class="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[1px] lg:hidden"
      @click="emit('close')"
    />
  </Transition>

  <aside
    class="fixed left-0 top-0 z-50 h-dvh max-h-dvh w-[var(--cms-sidebar-width)] shrink-0 transform-gpu transition-[width,transform] duration-200 ease-out lg:sticky lg:left-auto lg:z-auto lg:translate-x-0"
    :class="props.mobileOpen
      ? 'translate-x-0'
      : '-translate-x-full pointer-events-none lg:pointer-events-auto lg:translate-x-0'"
  >
    <div
      class="flex h-full min-h-0 flex-col overflow-hidden border-r border-[var(--border-soft)] bg-[var(--surface-card)] p-4 shadow-none transition-[padding] duration-200"
      :class="props.collapsed ? 'lg:px-3 lg:py-4' : ''"
    >
      <div class="flex items-center gap-2">
        <NuxtLink
          to="/admin"
          class="flex min-w-0 flex-1 items-center gap-3 rounded-md px-2 py-1 transition-all duration-300"
          :class="props.collapsed ? 'lg:justify-center lg:gap-0 lg:px-0' : ''"
          :aria-label="props.collapsed ? 'Blog_后台' : undefined"
          @click="emit('close')"
        >
          <span class="flex size-10 shrink-0 items-center justify-center rounded-md bg-[var(--primary)] text-white shadow-none">
            <Icon name="lucide:layout-grid" class="size-4" />
          </span>
          <span
            class="min-w-0 overflow-hidden whitespace-nowrap transition-all duration-200"
            :class="props.collapsed ? 'lg:w-0 lg:opacity-0' : 'w-auto opacity-100'"
          >
            <span class="block text-xl font-bold tracking-tight text-[var(--text-primary)]">Blog_后台</span>
          </span>
        </NuxtLink>

        <UiButton
          variant="ghost"
          size="icon"
          class="shrink-0 text-[var(--text-secondary)] hover:text-[var(--text-primary)] lg:hidden"
          aria-label="关闭侧边栏"
          @click="emit('close')"
        >
          <Icon name="lucide:x" class="size-4" />
        </UiButton>
      </div>

      <nav class="mt-8 min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin]">
        <AdminSidebarNavItem
          v-for="item in navItems"
          :key="getItemKey(item)"
          :item="item"
          :item-key="getItemKey(item)"
          :expanded-keys="expandedMenus"
          :collapsed="props.collapsed"
          @close="emit('close')"
          @toggle="toggleMenu"
        />
      </nav>

      <UiButton
        variant="ghost"
        size="icon"
        class="mt-4 hidden shrink-0 border border-[var(--border-soft)] bg-[var(--surface-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] lg:inline-flex"
        :class="props.collapsed ? 'lg:self-center' : 'lg:self-start'"
        :aria-label="props.collapsed ? '展开侧边栏' : '收起侧边栏'"
        :title="props.collapsed ? '展开侧边栏' : '收起侧边栏'"
        @click="emit('toggleCollapse')"
      >
        <Icon :name="props.collapsed ? 'lucide:panel-left-open' : 'lucide:panel-left-close'" class="size-4 shrink-0 transition-transform duration-200" />
      </UiButton>
    </div>
  </aside>
</template>
