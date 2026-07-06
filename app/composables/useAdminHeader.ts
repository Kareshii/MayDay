export interface AdminHeaderAction {
  label: string
  icon?: string
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  to?: string
  disabled?: boolean
  onClick?: () => void | Promise<void>
}

export interface AdminHeaderSearch {
  value: string
  placeholder?: string
  label?: string
  onUpdate: (value: string) => void | Promise<void>
}

interface AdminHeaderState {
  title: string
  subtitle: string
  actions: AdminHeaderAction[]
  search: AdminHeaderSearch | null
}

const emptyHeaderState: AdminHeaderState = {
  title: '',
  subtitle: '',
  actions: [],
  search: null,
}

const adminHeaderState = shallowRef<AdminHeaderState>(emptyHeaderState)
let activeHeaderOwner: symbol | null = null

export function useAdminHeader() {
  function setHeader(input: Partial<AdminHeaderState>, owner?: symbol) {
    if (owner) {
      activeHeaderOwner = owner
    }

    adminHeaderState.value = {
      title: input.title || '',
      subtitle: input.subtitle || '',
      actions: input.actions || [],
      search: input.search || null,
    }
  }

  function clearHeader(owner?: symbol) {
    if (owner && activeHeaderOwner !== owner) {
      return
    }

    activeHeaderOwner = null
    adminHeaderState.value = emptyHeaderState
  }

  return {
    adminHeaderState,
    setHeader,
    clearHeader,
  }
}
