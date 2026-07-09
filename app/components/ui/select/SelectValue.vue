<script setup lang="ts">
import { SelectValue } from 'reka-ui'
import { cn } from '@/utils/cn'

const attrs = useAttrs()
</script>

<template>
  <SelectValue
    v-bind="attrs"
    :class="cn('block min-w-0 truncate', attrs.class as string)"
  />
</template>
