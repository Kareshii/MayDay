<script setup lang="ts">
type NavItem = {
  title: string
  to: string
  icon: string
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

  return isActive(props.item.to)
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

function toggleChildren() {
  emit('toggle', props.itemKey)
}

function getChildKey(child: NavItem) {
  return `${props.itemKey}/${child.title}`
}
</script>

<template>
  <div class="space-y-1">
    <div
      class="group flex items-center transition-all duration-300"
      :class="[
        rowShapeClasses,
        rowClasses,
        props.collapsed ? 'lg:justify-center lg:hover:translate-x-0' : '',
      ]"
    >
      <NuxtLink
        :to="props.item.to"
        class="flex min-w-0 flex-1 items-center transition-all duration-300"
        :class="[
          linkClasses,
          props.collapsed ? 'lg:flex-none lg:justify-center lg:gap-0 lg:px-0' : '',
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
          class="min-w-0 truncate transition-all duration-200"
          :class="props.collapsed ? 'lg:w-0 lg:opacity-0' : 'w-auto opacity-100'"
        >
          {{ props.item.title }}
        </span>
      </NuxtLink>

      <UiButton
        v-if="hasChildren"
        type="button"
        variant="ghost"
        size="icon"
        class="mr-2 size-7 shrink-0 text-[var(--text-secondary)] hover:bg-[var(--surface-highest)] hover:text-[var(--text-primary)]"
        :class="props.collapsed ? 'lg:hidden' : ''"
        :aria-label="expanded ? `收起${props.item.title}` : `展开${props.item.title}`"
        :aria-expanded="expanded"
        @click.stop="toggleChildren"
      >
        <Icon
          name="lucide:chevron-right"
          class="size-4 transition-transform duration-200"
          :class="expanded ? 'rotate-90' : ''"
        />
      </UiButton>
    </div>

    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="-translate-y-1 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-120 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="-translate-y-1 opacity-0"
    >
      <div
        v-if="hasChildren && expanded"
        class="space-y-1 transition-all duration-200"
        :class="[childIndentClasses, props.collapsed ? 'lg:hidden' : '']"
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
