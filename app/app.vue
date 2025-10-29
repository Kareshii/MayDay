<script setup lang="ts">
const { cover } = useAppConfig()

useSeoMeta({
  ogImage: cover,
  twitterCard: 'summary_large_image',
})
</script>

<template>
  <div class="sm:pt-6 sm:pb-10">
    <SvgModule/>
    <Html />
    <!-- <NuxtLoadingIndicator /> -->
    <AppNavbar />
    <NuxtPage />
  </div>
</template>
