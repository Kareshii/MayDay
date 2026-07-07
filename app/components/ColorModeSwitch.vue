<script setup lang="ts">
type ThemePreference = 'light' | 'dark'

const props = withDefaults(defineProps<{
  transparent?: boolean
}>(), {
  transparent: false,
})

const colorMode = useColorMode()

const options: Array<{
  value: ThemePreference
  label: string
  icon: string
}> = [
  // { value: 'system', label: '跟随系统', icon: 'system-mode' },
  { value: 'light', label: '亮色', icon: 'light-mode' },
  { value: 'dark', label: '暗色', icon: 'dark-mode' },
]

const selectedPreference = computed<ThemePreference>(() => {
  if (colorMode.preference === 'light' || colorMode.preference === 'dark') {
    return colorMode.preference
  }

  return 'light'
})

function setPreference(value: ThemePreference) {
  colorMode.preference = value
}
</script>

<template>
  <ColorScheme>
    <div
      class="group relative inline-flex h-10 items-center gap-1 rounded-full border p-1 transition-all duration-300"
      :class="props.transparent
        ? 'border-white/12 bg-white/8 backdrop-blur-md hover:bg-white/12 hover:border-white/20'
        : 'border-[var(--border)] bg-[var(--card)]/82 backdrop-blur-xl hover:border-[var(--border-strong)]'"
    >
      <div
        class="absolute size-8 rounded-full transition-transform duration-500"
        style="transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);"
        :class="[
          selectedPreference === 'dark' ? 'translate-x-9' : 'translate-x-0',
          props.transparent
            ? 'border border-white/38 bg-white/28 shadow-[0_8px_22px_-14px_rgba(255,255,255,0.95)]'
            : 'border border-[var(--border-strong)] bg-white shadow-[0_10px_24px_-18px_rgba(15,23,42,0.8)] dark:border-white/35 dark:bg-white/16 dark:shadow-[0_10px_24px_-18px_rgba(255,255,255,0.6)]'
        ]"
      />

      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        :title="option.label"
        :aria-label="option.label"
        :aria-pressed="selectedPreference === option.value"
        class="group/btn relative z-10 inline-flex size-8 items-center justify-center rounded-full transition-colors duration-300"
        :class="[
          selectedPreference === option.value
            ? (props.transparent ? 'text-white' : 'text-[var(--text-primary)]')
            : (props.transparent ? 'text-white/70' : 'text-[var(--text-primary)]/70')
        ]"
        @click="setPreference(option.value)"
      >
        <span
          class="inline-flex items-center justify-center"
          :class="option.value === 'dark' ? 'scale-x-[-1]' : ''"
        >
          <Icon
            :name="option.icon"
            class="transition-all duration-500"
            style="transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);"
            :class="[
              selectedPreference === option.value ? 'scale-100 opacity-100' : 'scale-75 opacity-50',
              option.value === 'light' ? (selectedPreference === 'light' ? 'text-amber-400' : 'group-hover/btn:text-amber-400/80 group-hover/btn:scale-90 group-hover/btn:opacity-100') : '',
              option.value === 'dark' ? (selectedPreference === 'dark' ? 'text-sky-400' : 'group-hover/btn:text-sky-400/80 group-hover/btn:scale-90 group-hover/btn:opacity-100') : '',
            ]"
          />
        </span>
        <span class="sr-only">{{ option.label }}</span>
      </button>
    </div>
  </ColorScheme>
</template>
