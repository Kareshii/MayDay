<script setup lang="ts">
import { useWindowScroll } from '@vueuse/core'
import { isPublicRouteEnabled } from '~~/shared/types/routes'
import { siteSections } from '@/utils/siteSections'

const route = useRoute()
const { y } = useWindowScroll()
const mobileOpen = ref(false)
const shortcutLabel = ref('Ctrl K')
const openPaletteEvent = 'mayday:open-command-palette'
const heroNavbarOverlay = useState<boolean>('hero-navbar-overlay', () => false)
const { data: siteConfig } = await usePublicSiteConfig()
const navigation = computed(() => siteSections
  .filter(section => isPublicRouteEnabled(siteConfig.value.routes, section.routeId))
  .map(section => ({ title: section.navTitle, path: section.path })))

const siteName = computed(() => siteConfig.value.site.siteName || 'mayday.life')
const siteLogo = computed(() => siteConfig.value.site.siteLogo)
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

function openCommandPalette() {
  window.dispatchEvent(new CustomEvent(openPaletteEvent))
  mobileOpen.value = false
}
</script>

<template>
  <header
    class="site-navbar"
    :data-transparent="isTransparent"
    :data-menu-open="mobileOpen"
  >
    <div class="site-navbar__frame">
      <div class="site-navbar__bar">
        <NuxtLink to="/" class="site-navbar__brand" :aria-label="siteName">
          <span class="site-navbar__mark" :class="{ 'has-image': siteLogo }" aria-hidden="true">
            <img v-if="siteLogo" :src="siteLogo" alt="" class="size-full object-cover">
          </span>
          <span class="site-navbar__name">{{ siteName }}</span>
        </NuxtLink>

        <nav class="site-navbar__links" aria-label="主导航">
          <NuxtLink
            v-for="link in navigation"
            :key="link.path"
            :to="link.path"
            class="site-navbar__nav-link"
            :data-active="isActive(link.path)"
            :aria-current="isActive(link.path) ? 'page' : undefined"
          >
            {{ link.title }}
          </NuxtLink>
        </nav>

        <div class="site-navbar__actions">
          <button
            type="button"
            class="site-navbar__search"
            aria-label="打开快捷搜索"
            @click="openCommandPalette"
          >
            <Icon name="lucide:search" class="size-[18px]" />
            <kbd>{{ shortcutLabel }}</kbd>
          </button>
          <button
            type="button"
            class="site-navbar__menu-button"
            :aria-label="mobileOpen ? '关闭导航菜单' : '打开导航菜单'"
            :aria-expanded="mobileOpen"
            aria-controls="site-navigation-menu"
            :data-open="mobileOpen"
            @click="mobileOpen = !mobileOpen"
          >
            <Icon :name="mobileOpen ? 'lucide:x' : 'lucide:menu'" class="size-5" />
          </button>
        </div>
      </div>

      <Transition name="site-menu">
        <nav
          v-if="mobileOpen"
          id="site-navigation-menu"
          class="site-navbar__mobile-panel"
          aria-label="移动导航"
        >
          <NuxtLink
            v-for="(link, index) in navigation"
            :key="link.path"
            :to="link.path"
            class="site-navbar__nav-link"
            :data-active="isActive(link.path)"
            :aria-current="isActive(link.path) ? 'page' : undefined"
          >
            <span class="site-navbar__link-index">0{{ index + 1 }}</span>
            {{ link.title }}
            <Icon name="lucide:arrow-up-right" class="ml-auto size-5" />
          </NuxtLink>
        </nav>
      </Transition>
    </div>
  </header>
</template>
