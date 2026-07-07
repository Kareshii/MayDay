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
      class="group w-full rounded-xl border border-black/5 bg-white/80 px-4 py-3.5 text-[var(--text-primary)] shadow-xl shadow-black/5 backdrop-blur-xl outline-none transition-all duration-300 dark:border-white/10 dark:bg-zinc-900/80 dark:shadow-black/20 data-[state=open]:animate-[admin-toast-in_300ms_cubic-bezier(0.16,1,0.3,1)] data-[state=closed]:animate-[admin-toast-out_200ms_ease-in] data-[swipe=end]:translate-x-[var(--reka-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--reka-toast-swipe-move-x)]"
      @update:open="handleOpenChange(toast, $event)"
      @escape-key-down="closeToast(toast.id)"
      @swipe-end="removeToast(toast.id)"
    >
      <div class="flex items-center gap-3">
        <div class="flex size-5 shrink-0 items-center justify-center rounded-full bg-white/50 dark:bg-black/20" :class="{ 'bg-emerald-50 dark:bg-emerald-950/30': toast.type === 'success', 'bg-red-50 dark:bg-red-950/30': toast.type === 'error', 'bg-amber-50 dark:bg-amber-950/30': toast.type === 'warning', 'bg-sky-50 dark:bg-sky-950/30': toast.type === 'info' }">
          <Icon
            :name="toastMeta[toast.type].icon"
            class="size-4 shrink-0"
            :class="toastMeta[toast.type].iconClass"
          />
        </div>
        <div class="min-w-0 flex-1">
          <ToastTitle class="text-[15px] font-semibold tracking-tight leading-5">
            {{ toast.title }}
          </ToastTitle>
          <ToastDescription
            v-if="toast.description"
            class="mt-1 block break-words text-[13px] leading-5 text-[var(--text-secondary)]"
          >
            {{ toast.description }}
          </ToastDescription>
        </div>
        <ToastClose class="-mr-1 inline-flex size-7 shrink-0 items-center justify-center rounded-md text-[var(--text-secondary)] opacity-0 transition-all hover:bg-black/5 hover:text-[var(--text-primary)] group-hover:opacity-100 focus:opacity-100 dark:hover:bg-white/10 [&_svg]:size-4">
          <Icon name="lucide:x" />
        </ToastClose>
      </div>
    </ToastRoot>
    <ToastViewport class="fixed right-4 top-4 z-[160] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-3 outline-none" />
  </ToastProvider>
</template>
