import { computed, ref, toRaw, type Ref } from 'vue'

export function useDialogDraftGuard<T>(
  draft: Ref<T>,
  closeDraft: () => void,
  isCloseBlocked: () => boolean = () => false,
) {
  const baseline = ref('null')
  const discardDialogOpen = ref(false)
  const isDraftDirty = computed(() => JSON.stringify(toRaw(draft.value)) !== baseline.value)

  function captureDraft() {
    baseline.value = JSON.stringify(toRaw(draft.value))
  }

  function closeNow() {
    discardDialogOpen.value = false
    closeDraft()
    baseline.value = 'null'
  }

  function requestClose() {
    if (isCloseBlocked()) {
      return
    }

    if (isDraftDirty.value) {
      discardDialogOpen.value = true
      return
    }

    closeNow()
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      requestClose()
    }
  }

  function discardDraft() {
    closeNow()
  }

  return {
    discardDialogOpen,
    isDraftDirty,
    captureDraft,
    requestClose,
    handleOpenChange,
    discardDraft,
  }
}
