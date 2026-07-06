<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const nuxtApp = useNuxtApp()
const mobileOpen = ref(false)
const sidebarCollapsed = ref(false)
const routeLoading = ref(false)
const routeProgress = ref(0)
let progressTimer: ReturnType<typeof setInterval> | null = null
let finishTimer: ReturnType<typeof setTimeout> | null = null

watch(() => route.path, () => {
  mobileOpen.value = false
})

function clearProgressTimers() {
  if (progressTimer) {
    window.clearInterval(progressTimer)
    progressTimer = null
  }

  if (finishTimer) {
    window.clearTimeout(finishTimer)
    finishTimer = null
  }
}

function startRouteLoading() {
  clearProgressTimers()
  routeLoading.value = true
  routeProgress.value = 18

  progressTimer = window.setInterval(() => {
    routeProgress.value = Math.min(routeProgress.value + Math.max(2, (92 - routeProgress.value) * 0.16), 92)
  }, 180)
}

function finishRouteLoading() {
  if (!routeLoading.value) {
    return
  }

  if (progressTimer) {
    window.clearInterval(progressTimer)
    progressTimer = null
  }

  routeProgress.value = 100
  finishTimer = window.setTimeout(() => {
    routeLoading.value = false
    routeProgress.value = 0
    finishTimer = null
  }, 260)
}

onMounted(() => {
  router.beforeEach((to, from) => {
    if (to.fullPath !== from.fullPath) {
      startRouteLoading()
    }
  })

  router.afterEach(() => {
    finishRouteLoading()
  })

  nuxtApp.hook('page:start', startRouteLoading)
  nuxtApp.hook('page:finish', finishRouteLoading)
})

onBeforeUnmount(() => {
  clearProgressTimers()
})
</script>

<template>
  <div
    class="cms-admin-shell min-h-dvh flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] lg:flex-row"
    :class="{ 'is-sidebar-collapsed': sidebarCollapsed }"
  >
    <div
      class="cms-route-progress"
      :class="{ 'is-active': routeLoading }"
      :aria-hidden="!routeLoading"
    >
      <div
        class="cms-route-progress__bar"
        :style="{ transform: `scaleX(${routeProgress / 100})` }"
      />
    </div>

    <AdminSidebar
      :mobile-open="mobileOpen"
      :collapsed="sidebarCollapsed"
      @close="mobileOpen = false"
      @toggle-collapse="sidebarCollapsed = !sidebarCollapsed"
    />

    <div class="min-h-dvh min-w-0 flex flex-1 flex-col">
      <AdminHeader @toggle="mobileOpen = true" />
      <main class="min-h-0 flex-1">
        <slot />
      </main>
    </div>
  </div>
</template>
