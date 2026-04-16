<script setup lang="ts">
import { useWindowScroll } from '@vueuse/core'
import { primaryNavigation } from '@/utils/siteSections'

const route = useRoute()
const { y } = useWindowScroll()
const mobileOpen = ref(false)

const navigation = [
  { title: '主页', path: '/' },
  ...primaryNavigation,
]

const isTransparent = computed(() => route.path === '/' && y.value < 24)

watch(() => route.path, () => {
  mobileOpen.value = false
})

function isActive(path: string) {
  return path === '/' ? route.path === path : route.path.startsWith(path)
}

function navLinkClass(path: string) {
  if (isActive(path)) {
    return isTransparent.value
      ? 'bg-white/14 text-white shadow-[0_10px_40px_-24px_rgba(255,255,255,0.85)]'
      : 'bg-black text-white dark:bg-white dark:text-black'
  }

  return isTransparent.value
    ? 'text-white/72 hover:bg-white/10 hover:text-white'
    : 'text-[var(--text-secondary)] hover:bg-black/5 hover:text-[var(--text-primary)] dark:hover:bg-white/10'
}
</script>

<template>
  <header class="fixed inset-x-0 top-0 z-50 transition-all duration-300"
    :class="isTransparent ? 'border-b-0 bg-transparent' : 'border-b border-[var(--border)] bg-[var(--card)]/82 shadow-[0_24px_64px_-44px_rgba(15,23,42,0.38)] backdrop-blur-xl'">
    <div class="site-container">
      <div class="flex h-18 items-center justify-between gap-4 py-4">
        <NuxtLink to="/" class="group flex items-center gap-3 transition-opacity hover:opacity-85">
          <span
            class="flex size-10 items-center justify-center rounded-full border text-xs font-semibold tracking-[0.3em] transition-colors"
            :class="isTransparent ? 'border-white/20 bg-white/10 text-white' : 'border-[var(--border)] bg-black text-white dark:bg-white dark:text-black'">
            M
          </span>
          <span>
            <span class="block text-[1.05rem] font-semibold tracking-[0.22em] uppercase"
              :class="isTransparent ? 'text-white' : 'text-[var(--text-primary)]'">
              mayday.life
            </span>
            <span class="block text-[11px] tracking-[0.2em]"
              :class="isTransparent ? 'text-white/56' : 'text-[var(--text-secondary)]'">
              archive for the blue years
            </span>
          </span>
        </NuxtLink>

        <nav class="hidden items-center gap-2 lg:flex">
          <NuxtLink v-for="link in navigation" :key="link.path" :to="link.path"
            class="rounded-full px-3 py-2 text-sm font-medium transition-all duration-200"
            :class="navLinkClass(link.path)">
            {{ link.title }}
          </NuxtLink>
        </nav>

        <div class="flex items-center gap-2">
          <ColorModeSwitch :class="isTransparent ? 'text-white' : 'text-[var(--text-primary)]'" />
          <button class="inline-flex size-10 items-center justify-center rounded-full border lg:hidden"
            :class="isTransparent ? 'border-white/18 bg-white/10 text-white' : 'border-[var(--border)] bg-[var(--card)] text-[var(--text-primary)]'"
            @click="mobileOpen = !mobileOpen">
            <Icon :name="mobileOpen ? 'lucide:x' : 'lucide:menu'" class="size-5" />
          </button>
        </div>
      </div>

      <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 -translate-y-2"
        enter-to-class="opacity-100 translate-y-0" leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 -translate-y-2">
        <nav v-if="mobileOpen"
          class="mb-4 rounded-[1.5rem] border p-3 shadow-[0_24px_64px_-44px_rgba(15,23,42,0.48)] lg:hidden"
          :class="isTransparent ? 'border-white/12 bg-slate-950/75 backdrop-blur-xl' : 'border-[var(--border)] bg-[var(--card)]'">
          <div class="grid grid-cols-2 gap-2">
            <NuxtLink v-for="link in navigation" :key="link.path" :to="link.path"
              class="rounded-2xl px-3 py-3 text-sm font-medium transition-all" :class="navLinkClass(link.path)">
              {{ link.title }}
            </NuxtLink>
          </div>
        </nav>
      </Transition>
    </div>
  </header>
</template>
