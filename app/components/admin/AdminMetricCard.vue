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
        <p class="cms-kicker">
          {{ label }}
        </p>
        <p class="mt-4 text-4xl font-bold text-[var(--text-primary)]">
          {{ value }}
        </p>
        <p v-if="hint" class="mt-2 text-xs font-medium text-[var(--text-secondary)]">
          {{ hint }}
        </p>
      </div>

      <span
        v-if="icon"
        class="flex size-9 items-center justify-center rounded-md bg-[var(--primary-soft)] text-[var(--primary)]"
      >
        <Icon :name="icon" class="size-4" />
      </span>
    </div>
  </UiCard>
</template>
