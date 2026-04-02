<script setup lang="ts">
const route = useRoute()

const props = defineProps<{
  mobileOpen: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const navItems = [
  { title: '仪表盘', to: '/admin', icon: 'lucide:layout-dashboard' },
  { title: '文章管理', to: '/admin/articles', icon: 'lucide:file-text' },
  { title: '设置', to: '/admin/settings', icon: 'lucide:settings-2' },
]

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
      class="fixed inset-0 z-40 bg-black/50 lg:hidden"
      @click="emit('close')"
    />
  </Transition>

  <aside
    class="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-[var(--border)] bg-[var(--card-bg)]/95 backdrop-blur-xl transition-transform duration-200 lg:translate-x-0"
    :class="props.mobileOpen ? 'translate-x-0' : '-translate-x-full'"
  >
    <div class="flex h-20 items-center border-b border-[var(--border)] px-6">
      <NuxtLink to="/admin" class="flex items-center gap-3 text-[var(--text-primary)]" @click="emit('close')">
        <span class="flex size-10 items-center justify-center rounded-2xl bg-black text-white dark:bg-white dark:text-black">
          <Icon name="lucide:panel-left" class="size-5" />
        </span>
        <span>
          <span class="block text-sm font-semibold tracking-[0.18em] uppercase">Mayday CMS</span>
          <span class="block text-xs text-[var(--text-secondary)]">参考 blog-next 的后台结构</span>
        </span>
      </NuxtLink>
    </div>

    <nav class="flex-1 space-y-2 px-4 py-5">
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all"
        :class="isActive(item.to)
          ? 'bg-black text-white shadow-[0_18px_40px_-24px_rgba(15,23,42,0.8)] dark:bg-white dark:text-black'
          : 'text-[var(--text-secondary)] hover:bg-black/[0.04] hover:text-[var(--text-primary)] dark:hover:bg-white/[0.06]'"
        @click="emit('close')"
      >
        <Icon :name="item.icon" class="size-5" />
        <span>{{ item.title }}</span>
      </NuxtLink>
    </nav>

    <div class="border-t border-[var(--border)] px-5 py-4">
      <p class="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">
        技术栈
      </p>
      <p class="mt-2 text-sm font-medium text-[var(--text-primary)]">
        Nuxt + Tailwind v4 + Drizzle + TinyMCE
      </p>
    </div>
  </aside>
</template>
