<script setup lang="ts">
const { cover } = useAppConfig()
const route = useRoute()

const showSiteChrome = computed(() => !route.path.startsWith('/design'))

useSeoMeta({
  ogImage: cover,
  twitterCard: 'summary_large_image',
})
</script>

<template>
  <div class="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
    <Html lang="zh-CN" />
    <AppNavbar v-if="showSiteChrome" />
    <NuxtPage />
    <AppFooter v-if="showSiteChrome" />
  </div>
</template>
