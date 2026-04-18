<script setup lang="ts">
const route = useRoute()
const mobileOpen = ref(false)

watch(() => route.path, () => {
  mobileOpen.value = false
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] lg:flex-row">
    <AdminSidebar :mobile-open="mobileOpen" @close="mobileOpen = false" />

    <div class="min-h-screen min-w-0 flex flex-1 flex-col">
      <AdminHeader @toggle="mobileOpen = true" />
      <main class="min-h-0 flex-1">
        <slot />
      </main>
    </div>
  </div>
</template>
