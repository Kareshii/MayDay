<script setup lang="ts">
import { SelectRoot } from 'reka-ui'

const attrs = useAttrs()
</script>

<template>
  <SelectRoot v-bind="attrs">
    <slot />
  </SelectRoot>
</template>
