<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'

const route = useRoute()

const props = defineProps<{
  mobileOpen: boolean
  collapsed: boolean
}>()

const isMobile = useMediaQuery('(max-width: 860px)')
const compact = computed(() => props.collapsed || isMobile.value)

const emit = defineEmits<{
  close: []
  toggleCollapse: []
}>()

type NavItem = {
  title: string
  to: string
  icon: string
  exact?: boolean
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
      { title: '图册', to: '/admin/gallery', icon: 'lucide:images' },
      { title: '分类', to: '/admin/features/categories', icon: 'lucide:folder-tree' },
      { title: '评论', to: '/admin/features/comments', icon: 'lucide:message-square' },
    ],
  },
  {
    title: '站点设置',
    to: '/admin/features/site',
    icon: 'lucide:sliders-horizontal',
    children: [
      { title: '全局设置', to: '/admin/features/site', icon: 'lucide:globe-2', exact: true },
      { title: 'SEO 设置', to: '/admin/features/site/seo', icon: 'lucide:search' },
      { title: '导航设置', to: '/admin/features/site/navigation', icon: 'lucide:menu' },
      { title: '路由管理', to: '/admin/features/site/routes', icon: 'lucide:network' },
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

function isActive(to: string, exact = false) {
  const target = parseTo(to)

  if (target.status) {
    return route.path === target.path && route.query.status === target.status
  }

  if (exact) {
    return route.path === target.path
  }

  return target.path === '/admin'
    ? route.path === target.path
    : route.path === target.path || route.path.startsWith(`${target.path}/`)
}

function isGroupActive(item: NavItem): boolean {
  return isActive(item.to, item.exact) || Boolean(item.children?.some(child => isGroupActive(child)))
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
    if (compact.value) {
      expandedMenus.value = {}
      return
    }

    const next = { ...expandedMenus.value }

    for (const key of collectActiveMenuKeys(navItems)) {
      next[key] = true
    }

    expandedMenus.value = next
  },
  { immediate: true },
)

watch(compact, () => {
  expandedMenus.value = compact.value
    ? {}
    : Object.fromEntries(collectActiveMenuKeys(navItems).map(key => [key, true]))
})

function openMenu(key: string) {
  if (compact.value && !key.includes('/')) {
    expandedMenus.value = expandedMenus.value[key] ? {} : { [key]: true }
    return
  }

  toggleMenu(key)
}

function closeMenus() {
  expandedMenus.value = {}
}
</script>

<template>
  <button
    v-if="Object.values(expandedMenus).some(Boolean) && compact"
    type="button"
    class="cms-nav-dismiss"
    aria-label="关闭菜单"
    @click="closeMenus"
  />
  <aside class="cms-sidebar" :class="{ 'is-expanded': !compact, 'is-mobile-open': props.mobileOpen }" @keydown.esc="closeMenus">
    <div class="cms-sidebar__panel">
      <NuxtLink to="/admin" class="cms-sidebar__brand" aria-label="Blog 后台首页" @click="emit('close'); closeMenus()">
        <svg class="cms-sidebar__logo" viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <defs>
            <clipPath id="cms-logo-clip"><circle cx="20" cy="20" r="14" /></clipPath>
          </defs>
          <rect x="1" y="1" width="38" height="38" rx="12" stroke="currentColor" stroke-opacity=".7" />
          <g clip-path="url(#cms-logo-clip)" stroke="currentColor" stroke-width="1.5">
            <path v-for="line in 7" :key="line" :d="`M3 ${5 + line * 4} Q11 ${line * 4 - 1} 20 ${5 + line * 4} T37 ${5 + line * 4}`" />
          </g>
        </svg>
        <span v-if="!compact" class="cms-sidebar__brand-name">Blog_后台</span>
      </NuxtLink>
      <nav class="cms-sidebar__nav" aria-label="后台导航">
        <AdminSidebarNavItem
          v-for="(item, index) in navItems"
          :key="getItemKey(item)"
          :item="item"
          :item-key="getItemKey(item)"
          :expanded-keys="expandedMenus"
          :collapsed="compact"
          :style="{ '--nav-index': index }"
          @close="emit('close'); closeMenus()"
          @toggle="openMenu"
        />
      </nav>
      <div class="cms-sidebar__footer">
        <button type="button" class="cms-sidebar__collapse" :aria-label="props.collapsed ? '展开侧边栏' : '收起侧边栏'" :title="props.collapsed ? '展开侧边栏' : '收起侧边栏'" @click="emit('toggleCollapse')">
          <AppIcon :name="props.collapsed ? 'i-panel-left-open' : 'i-panel-left-close'" />
          <span v-if="!props.collapsed">收起菜单</span>
        </button>
        <NuxtLink to="/" class="cms-sidebar__exit" aria-label="返回前台" title="返回前台">
          <AppIcon name="i-log-out" />
          <span v-if="!props.collapsed">返回前台</span>
        </NuxtLink>
      </div>
    </div>
  </aside>
</template>
