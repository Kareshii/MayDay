<script setup lang="ts">
const { cover } = useAppConfig()
const route = useRoute()

const isAdminRoute = computed(() => route.path.startsWith('/admin'))
const showSiteChrome = computed(() => !route.path.startsWith('/design') && !isAdminRoute.value)

useSeoMeta({
  ogImage: cover,
  twitterCard: 'summary_large_image',
})
</script>

<template>
  <div :class="['min-h-screen text-[var(--text-primary)]', isAdminRoute ? 'cms-theme' : 'bg-[var(--bg-primary)]']">
    <Html lang="zh-CN" />
    <AppNavbar v-if="showSiteChrome" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <AppFooter v-if="showSiteChrome" />
  </div>
</template>
