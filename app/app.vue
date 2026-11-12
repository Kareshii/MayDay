<script setup lang="ts">
const { cover } = useAppConfig()
const route = useRoute()

const isAdminRoute = computed(() => route.path.startsWith('/admin'))
const showSiteChrome = computed(() => !route.path.startsWith('/design') && !isAdminRoute.value)

useHead({
  bodyAttrs: {
    class: computed(() => isAdminRoute.value ? 'cms-body' : 'site-design'),
  },
  link: computed(() => isAdminRoute.value ? [] : [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap' },
  ]),
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
      isAdminRoute ? 'cms-theme' : 'site-design-root',
      { 'site-design-studio': route.path.startsWith('/design') },
    ]"
  >
    <Html lang="zh-CN" />
    <AppNavbar v-if="showSiteChrome" />
    <GlobalCommandPalette v-if="showSiteChrome" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <AppFooter v-if="showSiteChrome" />
    <AdminToast />
  </div>
</template>
