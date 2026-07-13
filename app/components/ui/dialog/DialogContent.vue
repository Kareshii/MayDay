<script setup lang="ts">
import type { DialogContentEmits, DialogContentProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import {
  DialogClose,
  DialogContent,
  DialogPortal,
  useForwardPropsEmits,
} from "reka-ui"
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import DialogOverlay from "./DialogOverlay.vue"

defineOptions({
  inheritAttrs: false,
})

type DialogSize = 'sm' | 'md' | 'lg' | 'xl'

const props = withDefaults(defineProps<DialogContentProps & {
  class?: HTMLAttributes['class']
  showCloseButton?: boolean
  size?: DialogSize
}>(), {
  class: '',
  showCloseButton: true,
  size: 'md',
})
const emits = defineEmits<DialogContentEmits>()

const delegatedProps = reactiveOmit(props, 'class', 'showCloseButton', 'size')

const forwarded = useForwardPropsEmits(delegatedProps, emits)
const sizeClass: Record<DialogSize, string> = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-xl',
  xl: 'sm:max-w-2xl',
}
</script>

<template>
  <DialogPortal>
    <DialogOverlay />
    <DialogContent
      data-slot="dialog-content"
      v-bind="{ ...$attrs, ...forwarded }"
      :class="cn('bg-popover text-popover-foreground data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 ring-foreground/10 fixed top-1/2 left-1/2 z-[121] grid max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 gap-6 overflow-hidden rounded-lg p-6 text-sm shadow-lg ring-1 duration-150 outline-none', sizeClass[props.size], props.class)"
    >
      <slot />

      <Tooltip v-if="showCloseButton">
        <TooltipTrigger as-child>
          <DialogClose
            data-slot="dialog-close"
            as-child
          >
            <Button variant="ghost" class="absolute top-4 right-4" size="icon-sm" aria-label="关闭弹窗">
              <Icon name="lucide:x" class="size-4" />
              <span class="sr-only">关闭</span>
            </Button>
          </DialogClose>
        </TooltipTrigger>
        <TooltipContent>关闭弹窗</TooltipContent>
      </Tooltip>
    </DialogContent>
  </DialogPortal>
</template>
