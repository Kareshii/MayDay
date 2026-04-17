<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  hint?: string
  icon?: string
}>()
</script>

<template>
  <UiCard class="relative overflow-hidden p-6">
    <div class="pointer-events-none absolute -bottom-12 -right-10 size-28 rounded-full bg-[var(--primary-soft)]/80 blur-2xl" />

    <div class="relative flex items-start justify-between gap-4">
      <div>
        <p class="cms-kicker">
          {{ label }}
        </p>
        <p class="mt-4 text-5xl font-extrabold tracking-tight text-[var(--text-primary)]">
          {{ value }}
        </p>
        <p v-if="hint" class="mt-2 text-xs font-medium text-[var(--text-secondary)]">
          {{ hint }}
        </p>
      </div>

      <span
        v-if="icon"
        class="flex size-10 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]"
      >
        <Icon :name="icon" class="size-4" />
      </span>
    </div>
  </UiCard>
</template>
