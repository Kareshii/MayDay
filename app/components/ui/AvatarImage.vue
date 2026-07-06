<script setup lang="ts">
import type { ImgHTMLAttributes } from 'vue'
import { AvatarImage } from 'reka-ui'
import { cn } from '@/utils/cn'

interface Props {
  src: string
  referrerPolicy?: ImgHTMLAttributes['referrerpolicy']
  crossOrigin?: ImgHTMLAttributes['crossorigin']
  as?: string
  asChild?: boolean
  class?: string
}

const props = defineProps<Props>()
const attrs = useAttrs()
</script>

<template>
  <AvatarImage
    :src="props.src"
    :referrer-policy="props.referrerPolicy"
    :cross-origin="props.crossOrigin"
    :as="props.as"
    :as-child="props.asChild"
    v-bind="attrs"
    :class="cn('size-full object-cover', props.class, attrs.class as string)"
  />
</template>
