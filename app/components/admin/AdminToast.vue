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

const toastMeta: Record<AdminToastType, { icon: string; iconClass: string }> = {
  success: {
    icon: 'lucide:check-circle-2',
    iconClass: 'text-emerald-600',
  },
  error: {
    icon: 'lucide:circle-alert',
    iconClass: 'text-red-600',
  },
  warning: {
    icon: 'lucide:triangle-alert',
    iconClass: 'text-amber-600',
  },
  info: {
    icon: 'lucide:info',
    iconClass: 'text-sky-600',
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
  <ToastProvider swipe-direction="right">
    <ToastRoot
      v-for="toast in toasts"
      :key="toast.id"
      :open="toast.open"
      :duration="toast.duration"
      class="w-full rounded-lg border border-[var(--border-soft)] bg-[var(--surface-card)] px-4 py-3 text-[var(--text-primary)] shadow-none outline-none backdrop-blur data-[state=open]:animate-[admin-toast-in_180ms_ease-out] data-[state=closed]:animate-[admin-toast-out_160ms_ease-in] data-[swipe=end]:translate-x-[var(--reka-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--reka-toast-swipe-move-x)]"
      @update:open="handleOpenChange(toast, $event)"
      @escape-key-down="closeToast(toast.id)"
      @swipe-end="removeToast(toast.id)"
    >
      <div class="flex items-start gap-3">
        <Icon
          :name="toastMeta[toast.type].icon"
          class="mt-0.5 size-4 shrink-0"
          :class="toastMeta[toast.type].iconClass"
        />
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
        <ToastClose class="-mr-1 inline-flex size-7 shrink-0 items-center justify-center rounded-md text-[var(--text-secondary)] transition hover:bg-[var(--surface-low)] hover:text-[var(--text-primary)]">
          <Icon name="lucide:x" class="size-4" />
        </ToastClose>
      </div>
    </ToastRoot>
    <ToastViewport class="fixed right-4 top-4 z-[160] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2 outline-none" />
  </ToastProvider>
</template>
