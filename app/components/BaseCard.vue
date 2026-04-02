<script setup lang="ts">
interface Props {
  hoverable?: boolean
  clickable?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  hoverable: true,
  clickable: false,
  padding: 'md'
})

const paddingClasses = computed(() => {
  const paddingMap = {
    none: '',
    sm: 'p-5',
    md: 'p-8',
    lg: 'p-10'
  }
  return paddingMap[props.padding]
})
</script>

<template>
  <div 
    class="glass-card rounded-xl transition-all duration-300"
    :class="[
      paddingClasses,
      {
        'hover:-translate-y-1 hover:border-cyan-500/30': hoverable,
        'cursor-pointer': clickable
      }
    ]"
  >
    <slot />
  </div>
</template>
