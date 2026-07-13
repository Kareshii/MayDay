<script setup lang="ts">
import type { ButtonVariants } from '.'
import { buttonVariants } from '.'
import { cn } from '@/utils/cn'

interface Props {
  as?: string
  variant?: ButtonVariants['variant']
  size?: ButtonVariants['size']
}

const props = withDefaults(defineProps<Props>(), {
  as: 'button',
  variant: 'default',
  size: 'default',
})

const attrs = useAttrs()
</script>

<template>
  <component
    :is="props.as"
    v-bind="attrs"
    data-slot="button"
    :class="cn(buttonVariants({ variant: props.variant, size: props.size }), attrs.class as string)"
  >
    <slot />
  </component>
</template>
