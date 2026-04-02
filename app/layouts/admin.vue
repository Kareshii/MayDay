<script setup lang="ts">
const route = useRoute()
const mobileOpen = ref(false)

watch(() => route.path, () => {
  mobileOpen.value = false
})
</script>

<template>
  <div class="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
    <AdminSidebar :mobile-open="mobileOpen" @close="mobileOpen = false" />

    <div class="min-h-screen lg:pl-72">
      <AdminHeader @toggle="mobileOpen = true" />
      <main class="p-4 lg:p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
