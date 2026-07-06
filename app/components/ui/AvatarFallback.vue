<script setup lang="ts">
import { AvatarFallback } from 'reka-ui'
import { cn } from '@/utils/cn'

const attrs = useAttrs()
</script>

<template>
  <AvatarFallback
    v-bind="attrs"
    :class="cn('flex size-full items-center justify-center text-xs font-bold', attrs.class as string)"
  >
    <slot />
  </AvatarFallback>
</template>
