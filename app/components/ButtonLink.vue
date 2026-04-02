<script setup>
defineProps({
  href: {
    type: String,
    required: true,
  },
  external: {
    type: Boolean,
    default: false,
  },
  icon: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <span class="not-prose">
    <NuxtLink
      :to="href"
      :external="external"
      class="inline-flex items-center gap-1 !text-white bg-gray-800 dark:bg-gray-200 !dark:text-gray-950 px-3 py-1 rounded no-underline transition-all duration-300 hover:bg-cyan-600 dark:hover:bg-cyan-500 hover:scale-105 hover:shadow-lg active:scale-95"
    >
      <Icon
        v-if="icon"
        :name="icon"
        class="w-4 h-4"
      />
      <slot mdc-unwrap="p" />
    </NuxtLink>
  </span>
</template>
