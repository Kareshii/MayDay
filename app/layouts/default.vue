<script setup lang="ts">
const route = useRoute()
const heroNavbarOverlay = useState<boolean>('hero-navbar-overlay', () => false)

const mainClass = computed(() => {
  if (route.path === '/') {
    return 'min-h-screen'
  }

  if (heroNavbarOverlay.value) {
    return 'min-h-screen pb-18'
  }

  return 'min-h-screen py-18'
})
</script>

<template>
  <main :class="mainClass">
    <slot>
      <h1 class="text-2xl">Page not found</h1>
    </slot>
  </main>
</template>
