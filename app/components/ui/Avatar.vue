<script setup lang="ts">
import { AvatarRoot } from 'reka-ui'
import { cn } from '@/utils/cn'

const attrs = useAttrs()
</script>

<template>
  <AvatarRoot
    v-bind="attrs"
    :class="cn('relative flex size-9 shrink-0 overflow-hidden rounded-full border border-[var(--border-soft)] bg-[var(--surface-high)] text-[var(--text-primary)]', attrs.class as string)"
  >
    <slot />
  </AvatarRoot>
</template>
