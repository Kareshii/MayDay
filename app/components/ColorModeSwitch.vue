<script setup lang="ts">
type ThemePreference = 'system' | 'light' | 'dark'

const colorMode = useColorMode()

const options: Array<{
  value: ThemePreference
  label: string
  icon: string
}> = [
  { value: 'system', label: '跟随系统', icon: 'system-mode' },
  { value: 'light', label: '亮色', icon: 'light-mode' },
  { value: 'dark', label: '暗色', icon: 'dark-mode' },
]

const selectedPreference = computed<ThemePreference>(() => {
  if (colorMode.preference === 'light' || colorMode.preference === 'dark' || colorMode.preference === 'system') {
    return colorMode.preference
  }

  return 'system'
})

function setPreference(value: ThemePreference) {
  colorMode.preference = value
}
</script>

<template>
  <ColorScheme placeholder="...">
    <div class="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--card)]/82 p-1 backdrop-blur-xl">
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        :title="option.label"
        :aria-label="option.label"
        :aria-pressed="selectedPreference === option.value"
        class="inline-flex size-8 items-center justify-center rounded-full transition-all duration-200"
        :class="selectedPreference === option.value
          ? 'bg-black/88 text-white shadow-[0_14px_34px_-20px_rgba(15,23,42,0.9)] dark:bg-white dark:text-black opacity-100'
          : 'text-current opacity-70 hover:bg-black/8 hover:opacity-100 dark:hover:bg-white/12'"
        @click="setPreference(option.value)"
      >
        <Icon :name="option.icon" class="size-4" />
        <span class="sr-only">{{ option.label }}</span>
      </button>
    </div>
  </ColorScheme>
</template>
