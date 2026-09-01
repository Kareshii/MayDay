<script setup lang="ts">
const props = withDefaults(defineProps<{
  transparent?: boolean
}>(), {
  transparent: false,
})

const { isPhantomTheme, themeSwitching, toggleSiteTheme } = useSiteTheme()
const switchLabel = computed(() => isPhantomTheme.value ? '恢复默认主题' : '切换怪盗主题')
let transitionTimer: number | null = null

function handleToggle() {
  if (themeSwitching.value) {
    return
  }

  themeSwitching.value = true
  toggleSiteTheme()

  transitionTimer = window.setTimeout(() => {
    themeSwitching.value = false
    transitionTimer = null
  }, 520)
}

onBeforeUnmount(() => {
  if (transitionTimer) {
    window.clearTimeout(transitionTimer)
  }

  themeSwitching.value = false
})
</script>

<template>
  <div class="site-theme-toggle-wrap group relative size-10 shrink-0">
    <button
      type="button"
      class="site-theme-toggle inline-flex size-10 items-center justify-center border transition-colors"
      :class="[
        isPhantomTheme ? 'is-phantom' : '',
        props.transparent
          ? 'border-white/18 bg-white/10 text-white hover:bg-white/16'
          : 'border-[var(--border)] bg-[var(--card)] text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10',
      ]"
      :aria-label="switchLabel"
      :aria-pressed="isPhantomTheme"
      :title="switchLabel"
      @click="handleToggle"
    >
      <span class="site-theme-toggle__icon relative inline-flex size-6 items-center justify-center">
        <Icon
          :name="isPhantomTheme ? 'lucide:undo-2' : 'lucide:venetian-mask'"
          class="size-4"
        />
      </span>
      <span class="sr-only">{{ switchLabel }}</span>
    </button>

    <span
      role="tooltip"
      class="site-theme-toggle__tooltip pointer-events-none absolute right-0 top-[calc(100%+0.55rem)] z-[70] hidden whitespace-nowrap px-2.5 py-1.5 text-xs font-semibold opacity-0 shadow-lg transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 sm:block"
    >
      {{ switchLabel }}
    </span>
  </div>
</template>
