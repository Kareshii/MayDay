<script setup lang="ts">
interface Props {
  index: number
}

const props = defineProps<Props>()
</script>

<template>
  <div
    class="apple-carousel-item rounded-3xl"
    :style="{ animationDelay: `${Math.min(props.index * 120, 720)}ms` }"
  >
    <slot />
  </div>
</template>

<style scoped>
.apple-carousel-item {
  display: flex;
  position: relative;
  z-index: 1;
  flex: 0 0 var(--apple-card-basis-base, 100%);
  min-width: 0;
  animation: apple-card-enter 520ms cubic-bezier(0.22, 1, 0.36, 1) both;
  transition: flex-basis 500ms cubic-bezier(0.22, 1, 0.36, 1);
}

@media (min-width: 640px) {
  .apple-carousel-item {
    flex-basis: var(--apple-card-basis-sm, calc(50% - 4px));
  }
}

@media (min-width: 1024px) {
  .apple-carousel-item {
    flex-basis: var(--apple-card-basis-lg, calc(33.333% - 5.333px));
  }
}

@media (min-width: 1280px) {
  .apple-carousel-item {
    flex-basis: var(--apple-card-basis-xl, calc(25% - 6px));
  }
}

@media (hover: hover) and (pointer: fine) {
  .apple-carousel-item:hover {
    z-index: 2;
    flex-basis: var(--apple-card-hover-base, 100%);
  }
}

@media (hover: hover) and (pointer: fine) and (min-width: 640px) {
  .apple-carousel-item:hover {
    flex-basis: var(--apple-card-hover-sm, 70%);
  }
}

@media (hover: hover) and (pointer: fine) and (min-width: 1024px) {
  .apple-carousel-item:hover {
    flex-basis: var(--apple-card-hover-lg, 54%);
  }
}

@media (hover: hover) and (pointer: fine) and (min-width: 1280px) {
  .apple-carousel-item:hover {
    flex-basis: var(--apple-card-hover-xl, 44.444%);
  }
}

@keyframes apple-card-enter {
  from {
    opacity: 0;
    transform: translate3d(0, 20px, 0);
  }

  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}
</style>
