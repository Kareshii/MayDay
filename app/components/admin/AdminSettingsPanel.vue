<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  icon: string
}>()
</script>

<template>
  <section class="overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--surface-card)]">
    <header class="flex min-h-16 items-center justify-between gap-4 border-b border-[var(--border-soft)] px-5 py-3.5">
      <div class="flex min-w-0 items-center gap-3">
        <span class="grid size-8 shrink-0 place-items-center rounded-md bg-[var(--surface-high)] text-[var(--text-secondary)]">
          <Icon :name="icon" class="size-4" />
        </span>
        <span class="min-w-0">
          <span class="block text-sm font-semibold text-[var(--text-primary)]">{{ title }}</span>
          <span v-if="description" class="mt-0.5 block text-xs leading-5 text-[var(--text-secondary)]">
            {{ description }}
          </span>
        </span>
      </div>

      <div v-if="$slots.actions" class="shrink-0">
        <slot name="actions" />
      </div>
    </header>

    <div class="divide-y divide-[var(--border-soft)]">
      <slot />
    </div>
  </section>
</template>
