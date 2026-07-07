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

const rowClasses = computed(() => {
  const active = isGroupActive(props.item)

  if (props.depth === 0) {
    return active
      ? 'bg-[var(--primary-soft)] text-[var(--primary)]'
      : 'text-[var(--text-secondary)] hover:bg-[var(--surface-high)] hover:text-[var(--text-primary)]'
  }

  if (props.depth === 1) {
    return active
      ? 'bg-[var(--surface-low)] text-[var(--primary)]'
      : 'text-[var(--text-secondary)] hover:bg-[var(--surface-high)] hover:text-[var(--text-primary)]'
  }

  return isActive(props.item.to, props.item.exact)
    ? 'bg-[var(--primary-soft)] text-[var(--primary)]'
    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-high)] hover:text-[var(--text-primary)]'
})

const rowShapeClasses = computed(() => {
  if (props.depth === 0) {
    return 'rounded-md text-sm font-semibold'
  }

  return 'rounded-md'
})

const linkClasses = computed(() => {
  if (props.depth === 0) {
    return 'gap-3 px-4 py-3 text-sm font-semibold'
  }

  if (props.depth === 1) {
    return 'gap-3 px-3 py-2.5 text-sm font-medium'
  }

  return 'gap-2 px-3 py-2 text-xs font-semibold'
})

const childIndentClasses = computed(() => {
  if (props.depth === 0) {
    return 'pl-6'
  }

  return 'pl-5'
})

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
  <div class="space-y-1">
    <button
      v-if="hasChildren"
      type="button"
      class="group flex min-w-0 items-center transition-all duration-300"
      :class="[
        rowShapeClasses,
        rowClasses,
        linkClasses,
        props.collapsed ? 'mx-auto size-11 justify-center gap-0 px-0 py-0 hover:translate-x-0' : 'w-full',
      ]"
      :aria-label="props.collapsed ? props.item.title : undefined"
      :aria-expanded="expanded"
      @click="toggleChildren"
    >
      <Icon
        :name="props.item.icon"
        class="shrink-0 transition-transform duration-200"
        :class="props.depth === 0 ? 'size-4' : 'size-3.5'"
      />
      <span
        v-if="!props.collapsed"
        class="min-w-0 flex-1 truncate text-left transition-all duration-200"
      >
        {{ props.item.title }}
      </span>
      <Icon
        v-if="!props.collapsed"
        name="lucide:chevron-right"
        class="ml-auto size-4 shrink-0 text-[var(--text-secondary)] transition-transform duration-200 group-hover:text-[var(--text-primary)]"
        :class="expanded ? 'rotate-90' : ''"
      />
    </button>

    <NuxtLink
      v-else
      :to="props.item.to"
      class="group flex min-w-0 items-center transition-all duration-300"
      :class="[
        rowShapeClasses,
        rowClasses,
        linkClasses,
        props.collapsed ? 'mx-auto size-11 justify-center gap-0 px-0 py-0 hover:translate-x-0' : 'w-full',
      ]"
      :aria-label="props.collapsed ? props.item.title : undefined"
      :title="props.collapsed ? props.item.title : undefined"
      @click="emit('close')"
    >
      <Icon
        :name="props.item.icon"
        class="shrink-0 transition-transform duration-200"
        :class="props.depth === 0 ? 'size-4' : 'size-3.5'"
      />
      <span
        v-if="!props.collapsed"
        class="min-w-0 truncate transition-all duration-200"
      >
        {{ props.item.title }}
      </span>
    </NuxtLink>

    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="-translate-y-1 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-120 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="-translate-y-1 opacity-0"
    >
      <div
        v-if="hasChildren && expanded && !props.collapsed"
        class="space-y-1 transition-all duration-200"
        :class="childIndentClasses"
      >
        <AdminSidebarNavItem
          v-for="child in props.item.children"
          :key="getChildKey(child)"
          :item="child"
          :item-key="getChildKey(child)"
          :expanded-keys="props.expandedKeys"
          :collapsed="props.collapsed"
          :depth="props.depth + 1"
          @close="emit('close')"
          @toggle="emit('toggle', $event)"
        />
      </div>
    </Transition>
  </div>
</template>
