<script setup lang="ts">
const { cover } = useAppConfig()
const route = useRoute()
const { isPhantomTheme, themeSwitching } = useSiteTheme()

const isAdminRoute = computed(() => route.path.startsWith('/admin'))
const showSiteChrome = computed(() => !route.path.startsWith('/design') && !isAdminRoute.value)
const phantomThemeActive = computed(() => showSiteChrome.value && isPhantomTheme.value)
const bodyClass = computed(() => {
  if (isAdminRoute.value) {
    return 'cms-body'
  }

  return phantomThemeActive.value ? 'site-theme-phantom' : ''
})

useHead({
  bodyAttrs: {
    class: bodyClass,
  },
})

useSeoMeta({
  ogImage: cover,
  twitterCard: 'summary_large_image',
})
</script>

<template>
  <div
    :class="[
      'min-h-dvh text-[var(--text-primary)]',
      isAdminRoute ? 'cms-theme' : 'bg-[var(--bg-primary)]',
      phantomThemeActive ? 'site-theme-phantom' : '',
    ]"
  >
    <Html lang="zh-CN" />
    <div v-if="themeSwitching && showSiteChrome" class="site-theme-wipe" aria-hidden="true">
      <span class="site-theme-wipe__slash" />
      <span class="site-theme-wipe__slash site-theme-wipe__slash--secondary" />
      <span class="site-theme-wipe__burst" />
      <span class="site-theme-wipe__caption">
        {{ isPhantomTheme ? 'SHOW ME YOUR TRUE FORM' : 'CHANGE YOUR MIND' }}
      </span>
    </div>
    <AppNavbar v-if="showSiteChrome" />
    <GlobalCommandPalette v-if="showSiteChrome" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <AppFooter v-if="showSiteChrome" />
    <SiteBackToTop v-if="phantomThemeActive" />
    <AdminToast />
  </div>
</template>
