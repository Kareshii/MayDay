export type AdminToastType = 'success' | 'error' | 'warning' | 'info'

export interface AdminToastItem {
  id: string
  type: AdminToastType
  title: string
  description: string
  duration: number
  open: boolean
}

interface AdminToastInput {
  type?: AdminToastType
  title: string
  description?: string
  duration?: number
}

const TOAST_LIMIT = 4

function createToastId() {
  return `admin-toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function getRequestErrorMessage(error: unknown, fallback = '请求失败') {
  if (!error) {
    return fallback
  }

  if (typeof error === 'string') {
    return error
  }

  const requestError = error as {
    data?: {
      message?: unknown
      statusMessage?: unknown
    }
    message?: unknown
    statusMessage?: unknown
  }

  if (typeof requestError.data?.message === 'string') {
    return requestError.data.message
  }

  if (typeof requestError.data?.statusMessage === 'string') {
    return requestError.data.statusMessage
  }

  if (typeof requestError.message === 'string') {
    return requestError.message
  }

  if (typeof requestError.statusMessage === 'string') {
    return requestError.statusMessage
  }

  return fallback
}

export function useAdminToast() {
  const toasts = useState<AdminToastItem[]>('admin-toasts', () => [])

  function removeToast(id: string) {
    toasts.value = toasts.value.filter(toast => toast.id !== id)
  }

  function closeToast(id: string) {
    const toast = toasts.value.find(item => item.id === id)

    if (!toast) {
      return
    }

    toast.open = false

    if (import.meta.client) {
      window.setTimeout(() => removeToast(id), 180)
      return
    }

    removeToast(id)
  }

  function showToast(input: AdminToastInput) {
    if (!import.meta.client) {
      return ''
    }

    const title = input.title.trim()
    const description = input.description?.trim() || ''
    const toast: AdminToastItem = {
      id: createToastId(),
      type: input.type || 'info',
      title,
      description: description === title ? '' : description,
      duration: input.duration ?? 3000,
      open: true,
    }

    toasts.value = [...toasts.value, toast].slice(-TOAST_LIMIT)
    return toast.id
  }

  function showSuccessToast(title: string, description?: string) {
    return showToast({ type: 'success', title, description })
  }

  function showErrorToast(title: string, description?: string) {
    return showToast({ type: 'error', title, description, duration: 4200 })
  }

  function showWarningToast(title: string, description?: string) {
    return showToast({ type: 'warning', title, description, duration: 3800 })
  }

  function showInfoToast(title: string, description?: string) {
    return showToast({ type: 'info', title, description })
  }

  return {
    toasts,
    showToast,
    showSuccessToast,
    showErrorToast,
    showWarningToast,
    showInfoToast,
    closeToast,
    removeToast,
  }
}
