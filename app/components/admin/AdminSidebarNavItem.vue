<script setup lang="ts">
type NavItem = {
  title: string
  to: string
  icon: string
  exact?: boolean
  children?: NavItem[]
}

const route = useRoute()

const props = withDefaults(defineProps<{
  item: NavItem
  itemKey: string
  expandedKeys: Record<string, boolean>
  collapsed: boolean
  depth?: number
}>(), {
  depth: 0,
})

const emit = defineEmits<{
  close: []
  toggle: [key: string]
}>()

const hasChildren = computed(() => Boolean(props.item.children?.length))
const expanded = computed(() => hasChildren.value && props.expandedKeys[props.itemKey] === true)

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

function toggleChildren() {
  emit('toggle', props.itemKey)
}

function getChildKey(child: NavItem) {
  return `${props.itemKey}/${child.title}`
}
</script>

<template>
  <div class="cms-nav-item" :class="{ 'is-active': isGroupActive(props.item), 'is-open': expanded, 'is-top-level': props.depth === 0 }">
    <button
      v-if="hasChildren"
      type="button"
      class="cms-nav-row"
      :class="{ 'is-icon-only': props.collapsed }"
      :aria-label="props.item.title"
      :title="props.collapsed ? props.item.title : undefined"
      :aria-expanded="expanded"
      @click="toggleChildren"
    >
      <AppIcon :name="props.item.icon" class="cms-nav-row__icon" />
      <span v-if="!props.collapsed" class="cms-nav-row__label">{{ props.item.title }}</span>
      <AppIcon v-if="!props.collapsed" name="i-chevron-right" class="cms-nav-row__chevron" :class="{ 'rotate-90': expanded }" />
    </button>
    <NuxtLink
      v-else
      :to="props.item.to"
      class="cms-nav-row"
      :class="{ 'is-icon-only': props.collapsed }"
      :aria-label="props.item.title"
      :title="props.collapsed ? props.item.title : undefined"
      :aria-current="isActive(props.item.to, props.item.exact) ? 'page' : undefined"
      @click="emit('close')"
    >
      <AppIcon :name="props.item.icon" class="cms-nav-row__icon" />
      <span v-if="!props.collapsed" class="cms-nav-row__label">{{ props.item.title }}</span>
    </NuxtLink>
    <div v-if="hasChildren && expanded" class="cms-nav-children" :class="{ 'is-flyout': props.collapsed }">
      <p v-if="props.collapsed" class="cms-nav-children__title">{{ props.item.title }}</p>
      <AdminSidebarNavItem
        v-for="child in props.item.children"
        :key="getChildKey(child)"
        :item="child"
        :item-key="getChildKey(child)"
        :expanded-keys="props.expandedKeys"
        :collapsed="false"
        :depth="props.depth + 1"
        @close="emit('close')"
        @toggle="emit('toggle', $event)"
      />
    </div>
  </div>
</template>
