<script setup lang="ts">
import { MenubarMenu } from 'reka-ui'

const attrs = useAttrs()
</script>

<template>
  <MenubarMenu v-bind="attrs">
    <slot />
  </MenubarMenu>
</template>
