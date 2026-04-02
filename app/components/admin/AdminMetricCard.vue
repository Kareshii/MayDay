<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  hint?: string
  icon?: string
}>()
</script>

<template>
  <UiCard class="p-5">
    <div class="flex items-start justify-between gap-4">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
          {{ label }}
        </p>
        <p class="mt-3 text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
          {{ value }}
        </p>
        <p v-if="hint" class="mt-2 text-sm text-[var(--text-secondary)]">
          {{ hint }}
        </p>
      </div>
      <span v-if="icon" class="flex size-12 items-center justify-center rounded-2xl bg-black text-white dark:bg-white dark:text-black">
        <Icon :name="icon" class="size-5" />
      </span>
    </div>
  </UiCard>
</template>
