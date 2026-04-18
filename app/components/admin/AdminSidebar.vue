<script setup lang="ts">
const route = useRoute()

const props = defineProps<{
  mobileOpen: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const navItems = [
  { title: '\u4eea\u8868\u76d8', to: '/admin', icon: 'lucide:layout-dashboard' },
  { title: '\u6587\u7ae0', to: '/admin/articles', icon: 'lucide:file-text' },
  { title: '\u8bbe\u7f6e', to: '/admin/settings', icon: 'lucide:settings-2' },
]

const workspaceLabel = '\u7f16\u8f91\u5de5\u4f5c\u7a7a\u95f4'

function isActive(path: string) {
  return path === '/admin' ? route.path === path : route.path.startsWith(path)
}
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
    class="fixed inset-y-0 left-0 z-50 w-[var(--cms-sidebar-width)] shrink-0 transform-gpu transition-transform duration-200 ease-out lg:sticky lg:inset-y-auto lg:left-auto lg:top-0 lg:h-screen lg:z-auto lg:translate-x-0"
    :class="props.mobileOpen
      ? 'translate-x-0'
      : '-translate-x-full pointer-events-none lg:pointer-events-auto lg:translate-x-0'"
  >
    <div class="flex h-full flex-col border border-[var(--border-soft)] bg-[var(--surface-low)] p-4 shadow-[var(--surface-shadow)]">
      <NuxtLink to="/admin" class="flex items-center gap-3 rounded-xl px-2 py-1" @click="emit('close')">
        <span class="flex size-10 items-center justify-center rounded-xl bg-[var(--primary)] text-white shadow-[0_8px_16px_-12px_rgba(0,72,141,0.8)]">
          <Icon name="lucide:layout-grid" class="size-4" />
        </span>
        <span>
          <span class="block text-xl font-bold tracking-tight text-[var(--text-primary)]">Blog_CMS</span>
          <span class="block text-xs text-[var(--text-secondary)]">{{ workspaceLabel }}</span>
        </span>
      </NuxtLink>

      <nav class="mt-8 flex-1 space-y-2">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition"
          :class="isActive(item.to)
            ? 'bg-[var(--primary-soft)] text-[var(--primary)]'
            : 'text-[var(--text-secondary)] hover:bg-[var(--surface-high)] hover:text-[var(--text-primary)]'"
          @click="emit('close')"
        >
          <Icon :name="item.icon" class="size-4" />
          <span>{{ item.title }}</span>
        </NuxtLink>
      </nav>
    </div>
  </aside>
</template>
