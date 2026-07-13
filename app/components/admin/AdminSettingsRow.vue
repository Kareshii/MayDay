<script setup lang="ts">
withDefaults(defineProps<{
  label: string
  description?: string
  align?: 'center' | 'start'
}>(), {
  description: '',
  align: 'start',
})
</script>

<template>
  <div class="space-y-3 px-5 py-5">
    <div class="min-w-0 max-w-xl">
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
