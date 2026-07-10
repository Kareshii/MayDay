<script setup lang="ts">
withDefaults(defineProps<{
  label: string
  description?: string
  align?: 'center' | 'start'
}>(), {
  description: '',
  align: 'center',
})
</script>

<template>
  <div
    class="grid gap-4 px-5 py-5 lg:grid-cols-[minmax(11rem,0.42fr)_minmax(0,1fr)] lg:gap-8"
    :class="align === 'start' ? 'lg:items-start' : 'lg:items-center'"
  >
    <div class="min-w-0">
      <p class="text-sm font-medium text-[var(--text-primary)]">
        {{ label }}
      </p>
      <p v-if="description" class="mt-1 max-w-md text-xs leading-5 text-[var(--text-secondary)]">
        {{ description }}
      </p>
    </div>

    <div class="min-w-0">
      <slot />
    </div>
  </div>
</template>
