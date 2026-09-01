<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const nuxtApp = useNuxtApp()
const mobileOpen = ref(false)
const sidebarCollapsed = ref(false)
const routeLoading = ref(false)
const routeProgress = ref(0)
const mainContentRef = useTemplateRef<HTMLElement>('mainContentRef')
let progressTimer: number | null = null
let finishTimer: number | null = null
let routeLoadingStartedAt = 0
let removeBeforeEach: (() => void) | null = null
let removeAfterEach: (() => void) | null = null
let removeRouterError: (() => void) | null = null
let removePageStartHook: (() => void) | null = null
let removePageFinishHook: (() => void) | null = null

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
  if (routeLoading.value && !finishTimer) {
    return
  }

  clearProgressTimers()
  routeLoading.value = true
  routeProgress.value = 18
  routeLoadingStartedAt = window.performance.now()

  progressTimer = window.setInterval(() => {
    routeProgress.value = Math.min(routeProgress.value + Math.max(2, (92 - routeProgress.value) * 0.16), 92)
  }, 180)
}

function finishRouteLoading() {
  if (!routeLoading.value || finishTimer) {
    return
  }

  if (progressTimer) {
    window.clearInterval(progressTimer)
    progressTimer = null
  }

  routeProgress.value = 100
  const minimumVisibleTime = 120
  const elapsed = window.performance.now() - routeLoadingStartedAt
  finishTimer = window.setTimeout(() => {
    routeLoading.value = false
    routeProgress.value = 0
    finishTimer = null
  }, Math.max(0, minimumVisibleTime - elapsed))
}

function handleNavigationIntent(event: MouseEvent) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return
  }

  const target = event.target

  if (!(target instanceof Element)) {
    return
  }

  const anchor = target.closest<HTMLAnchorElement>('a[href]')

  if (!anchor || anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self')) {
    return
  }

  const url = new URL(anchor.href, window.location.href)

  if (url.origin !== window.location.origin || !url.pathname.startsWith('/admin')) {
    return
  }

  const nextPath = `${url.pathname}${url.search}`
  const currentPath = `${window.location.pathname}${window.location.search}`

  if (nextPath !== currentPath) {
    startRouteLoading()
  }
}

onMounted(() => {
  removeBeforeEach = router.beforeEach((to, from) => {
    const nextPath = to.fullPath.replace(/#.*$/, '')
    const currentPath = from.fullPath.replace(/#.*$/, '')

    if (nextPath !== currentPath) {
      startRouteLoading()
    }
  })

  removeAfterEach = router.afterEach((to, from, failure) => {
    if (failure || to.path === from.path) {
      finishRouteLoading()
    }
  })

  removeRouterError = router.onError(finishRouteLoading)
  removePageStartHook = nuxtApp.hook('page:start', startRouteLoading)
  removePageFinishHook = nuxtApp.hook('page:finish', async () => {
    finishRouteLoading()
    await nextTick()
    mainContentRef.value?.focus({ preventScroll: true })
  })
})

onBeforeUnmount(() => {
  clearProgressTimers()
  removeBeforeEach?.()
  removeAfterEach?.()
  removeRouterError?.()
  removePageStartHook?.()
  removePageFinishHook?.()
})
</script>

<template>
  <UiTooltipProvider>
    <div
      class="cms-admin-shell min-h-dvh flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] lg:flex-row"
      :class="{ 'is-sidebar-collapsed': sidebarCollapsed }"
      @click.capture="handleNavigationIntent"
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

      <a
        href="#admin-main-content"
        class="fixed left-3 top-3 z-[200] -translate-y-20 rounded-md bg-[var(--surface-card)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)] shadow-lg transition-transform focus:translate-y-0"
      >
        跳到主内容
      </a>

      <AdminSidebar
        :mobile-open="mobileOpen"
        :collapsed="sidebarCollapsed"
        @close="mobileOpen = false"
        @toggle-collapse="sidebarCollapsed = !sidebarCollapsed"
      />

      <div class="min-h-dvh min-w-0 flex flex-1 flex-col">
        <AdminHeader @toggle="mobileOpen = true" />
        <main
          id="admin-main-content"
          ref="mainContentRef"
          class="relative min-h-0 flex-1 outline-none"
          tabindex="-1"
          :aria-busy="routeLoading"
        >
          <div
            class="transition-opacity duration-150"
            :class="routeLoading ? 'pointer-events-none opacity-0' : 'opacity-100'"
            :aria-hidden="routeLoading"
            :inert="routeLoading"
          >
            <slot />
          </div>

          <Transition
            enter-active-class="transition-opacity duration-150 ease-out"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition-opacity duration-150 ease-in"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
          >
            <AdminRouteSkeleton
              v-if="routeLoading"
              class="absolute inset-x-0 top-0 z-20"
            />
          </Transition>
        </main>
      </div>
    </div>
  </UiTooltipProvider>
</template>
