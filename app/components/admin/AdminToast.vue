<script setup lang="ts">
import {
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastRoot,
  ToastTitle,
  ToastViewport,
} from 'reka-ui'
import type { AdminToastItem, AdminToastType } from '@/composables/useAdminToast'

const { toasts, closeToast, removeToast } = useAdminToast()

const toastMeta: Record<AdminToastType, { icon: string; iconClass: string; softClass: string }> = {
  success: {
    icon: 'lucide:check-circle-2',
    iconClass: 'text-[var(--success)]',
    softClass: 'bg-[var(--success-soft)]',
  },
  error: {
    icon: 'lucide:circle-alert',
    iconClass: 'text-[var(--danger)]',
    softClass: 'bg-[var(--danger-soft)]',
  },
  warning: {
    icon: 'lucide:triangle-alert',
    iconClass: 'text-[var(--warning)]',
    softClass: 'bg-[var(--warning-soft)]',
  },
  info: {
    icon: 'lucide:info',
    iconClass: 'text-[var(--info)]',
    softClass: 'bg-[var(--info-soft)]',
  },
}

function handleOpenChange(toast: AdminToastItem, open: boolean) {
  if (open) {
    toast.open = true
    return
  }

  closeToast(toast.id)
}
</script>

<template>
  <UiTooltipProvider>
    <ToastProvider swipe-direction="right">
      <ToastRoot
        v-for="toast in toasts"
        :key="toast.id"
        :open="toast.open"
        :duration="toast.duration"
        class="group w-full rounded-md border border-[var(--border-soft)] bg-[var(--popover)] px-4 py-3 text-[var(--popover-foreground)] shadow-lg outline-none transition-[transform,opacity] duration-200 data-[state=open]:animate-[admin-toast-in_200ms_ease-out] data-[state=closed]:animate-[admin-toast-out_150ms_ease-in] data-[swipe=end]:translate-x-[var(--reka-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--reka-toast-swipe-move-x)]"
        @update:open="handleOpenChange(toast, $event)"
        @escape-key-down="closeToast(toast.id)"
        @swipe-end="removeToast(toast.id)"
      >
        <div class="flex items-center gap-3">
          <div class="flex size-8 shrink-0 items-center justify-center rounded-md" :class="toastMeta[toast.type].softClass">
            <Icon
              :name="toastMeta[toast.type].icon"
              class="size-4 shrink-0"
              :class="toastMeta[toast.type].iconClass"
            />
          </div>
          <div class="min-w-0 flex-1">
            <ToastTitle class="text-sm font-semibold leading-5">
              {{ toast.title }}
            </ToastTitle>
            <ToastDescription
              v-if="toast.description"
              class="mt-1 block break-words text-xs leading-5 text-[var(--text-secondary)]"
            >
              {{ toast.description }}
            </ToastDescription>
          </div>
          <UiTooltip>
            <UiTooltipTrigger as-child>
              <ToastClose
                class="-mr-1 inline-flex size-11 shrink-0 items-center justify-center rounded-md text-[var(--text-secondary)] outline-none transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] [&_svg]:size-4"
                aria-label="关闭通知"
              >
                <Icon name="lucide:x" />
              </ToastClose>
            </UiTooltipTrigger>
            <UiTooltipContent side="left">
              关闭通知
            </UiTooltipContent>
          </UiTooltip>
        </div>
      </ToastRoot>
      <ToastViewport class="fixed right-4 top-4 z-[160] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-3 outline-none" />
    </ToastProvider>
  </UiTooltipProvider>
</template>
