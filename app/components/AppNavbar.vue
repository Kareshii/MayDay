<script setup lang="ts">
import { useWindowScroll } from '@vueuse/core'
import { primaryNavigation } from '@/utils/siteSections'

interface NavbarSiteSettings {
  siteName: string
  siteLogo: string
}

interface NavbarSiteResponse {
  site: NavbarSiteSettings
}

const route = useRoute()
const { y } = useWindowScroll()
const mobileOpen = ref(false)
const shortcutLabel = ref('Ctrl K')
const openPaletteEvent = 'mayday:open-command-palette'
const heroNavbarOverlay = useState<boolean>('hero-navbar-overlay', () => false)
const { data: siteConfig } = await useFetch<NavbarSiteResponse>('/api/site', {
  key: 'navbar-site-config',
  default: () => ({
    site: {
      siteName: 'mayday.life',
      siteLogo: '',
    },
  }),
})

const navigation = [
  { title: '主页', path: '/' },
  ...primaryNavigation,
]

const siteName = computed(() => siteConfig.value.site.siteName || 'mayday.life')
const siteLogo = computed(() => siteConfig.value.site.siteLogo)
const siteLogoFallback = computed(() => siteName.value.trim().slice(0, 1).toUpperCase() || 'M')
const isTransparent = computed(() => {
  if (route.path === '/') {
    return y.value < 24
  }

  return heroNavbarOverlay.value && y.value < 24
})

watch(() => route.fullPath, () => {
  mobileOpen.value = false
})

onMounted(() => {
  if (/Mac|iPhone|iPad/.test(navigator.platform)) {
    shortcutLabel.value = '⌘K'
  }
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

function openCommandPalette() {
  window.dispatchEvent(new CustomEvent(openPaletteEvent))
  mobileOpen.value = false
}
</script>

<template>
  <header
    class="fixed inset-x-0 top-0 z-50 transition-all duration-300"
    :class="isTransparent ? 'border-b-0 bg-transparent' : 'border-b border-[var(--border)] bg-[var(--card)] shadow-[0_24px_64px_-44px_rgba(15,23,42,0.38)]'"
  >
    <div class="mx-auto w-full max-w-[92rem] px-4 sm:px-6 2xl:max-w-[96rem]" :class="{ 'pb-4': mobileOpen }">
      <div class="flex h-18 items-center justify-between gap-4 py-4">
        <div class="flex min-w-0 items-center gap-2 sm:gap-3">
          <NuxtLink to="/" class="group flex min-w-0 items-center gap-3 transition-opacity hover:opacity-85">
            <span
              class="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border text-xs font-semibold transition-colors"
              :class="isTransparent ? 'border-white/20 bg-white/10 text-white' : 'border-[var(--border)] bg-black text-white dark:bg-white dark:text-black'"
            >
              <img
                v-if="siteLogo"
                :src="siteLogo"
                :alt="siteName"
                class="size-full object-cover"
              >
              <span v-else class="tracking-[0.3em]">
                {{ siteLogoFallback }}
              </span>
            </span>
            <span class="min-w-0">
              <span
                class="block truncate text-[1.05rem] font-semibold tracking-[0.22em] uppercase"
                :class="isTransparent ? 'text-white' : 'text-[var(--text-primary)]'"
              >
                {{ siteName }}
              </span>
            </span>
          </NuxtLink>

          <button
            type="button"
            class="hidden h-10 w-56 shrink-0 items-center justify-between gap-3 rounded-full border px-3 text-sm font-semibold transition-all duration-200 sm:inline-flex lg:w-64 xl:w-72"
            :class="isTransparent ? 'border-white/18 bg-white/10 text-white hover:bg-white/16' : 'border-[var(--border)] bg-[var(--card)] text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10'"
            aria-label="打开快捷搜索"
            @click="openCommandPalette"
          >
            <span class="inline-flex min-w-0 items-center gap-2">
              <Icon name="lucide:search" class="size-4 shrink-0" />
              <span>搜索</span>
            </span>
            <kbd
              class="shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold leading-none"
              :class="isTransparent ? 'border-white/16 bg-white/10 text-white/72' : 'border-[var(--border)] bg-[var(--surface-low)] text-[var(--text-muted)]'"
            >
              {{ shortcutLabel }}
            </kbd>
          </button>
          <button
            type="button"
            class="inline-flex size-10 shrink-0 items-center justify-center rounded-full border transition-colors sm:hidden"
            :class="isTransparent ? 'border-white/18 bg-white/10 text-white hover:bg-white/16' : 'border-[var(--border)] bg-[var(--card)] text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10'"
            aria-label="打开快捷搜索"
            @click="openCommandPalette"
          >
            <Icon name="lucide:search" class="size-5" />
          </button>
        </div>

        <nav class="hidden items-center gap-2 lg:flex">
          <NuxtLink
            v-for="link in navigation"
            :key="link.path"
            :to="link.path"
            class="rounded-[4px 4px 0 0] px-3 py-2 text-sm font-medium transition-all duration-200"
            :class="navLinkClass(link.path)"
          >
            {{ link.title }}
          </NuxtLink>
        </nav>

        <div class="flex items-center gap-2">
          <ColorModeSwitch :transparent="isTransparent" :class="isTransparent ? 'text-white' : 'text-[var(--text-primary)]'" />
          <button
            type="button"
            class="inline-flex size-10 items-center justify-center rounded-full border lg:hidden"
            :class="isTransparent ? 'border-white/18 bg-white/10 text-white' : 'border-[var(--border)] bg-[var(--card)] text-[var(--text-primary)]'"
            aria-label="打开导航菜单"
            @click="mobileOpen = !mobileOpen"
          >
            <Icon :name="mobileOpen ? 'lucide:x' : 'lucide:menu'" class="size-5" />
          </button>
        </div>
      </div>

      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-2"
      >
        <nav
          v-if="mobileOpen"
          class="rounded-[1.5rem] border p-3 shadow-[0_24px_64px_-44px_rgba(15,23,42,0.48)] lg:hidden"
          :class="isTransparent ? 'border-white/12 bg-slate-950/75 backdrop-blur-xl' : 'border-[var(--border)] bg-[var(--card)]'"
        >
          <div class="grid grid-cols-2 gap-2">
            <NuxtLink
              v-for="link in navigation"
              :key="link.path"
              :to="link.path"
              class="rounded-2xl px-3 py-3 text-sm font-medium transition-all"
              :class="navLinkClass(link.path)"
            >
              {{ link.title }}
            </NuxtLink>
          </div>
        </nav>
      </Transition>
    </div>
  </header>
</template>
