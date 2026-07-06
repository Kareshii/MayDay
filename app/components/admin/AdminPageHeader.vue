<script setup lang="ts">
import type { AdminHeaderAction, AdminHeaderSearch } from '../../composables/useAdminHeader'

const props = defineProps<{
  title: string
  subtitle?: string
  actions?: AdminHeaderAction[]
  search?: AdminHeaderSearch | null
}>()

const { setHeader, clearHeader } = useAdminHeader()
const headerOwner = Symbol('admin-page-header')
let stopHeaderWatch: (() => void) | null = null

onMounted(() => {
  stopHeaderWatch = watch(
    () => ({
      title: props.title,
      subtitle: props.subtitle || '',
      actions: props.actions || [],
      search: props.search || null,
    }),
    (header) => {
      setHeader({
        title: header.title,
        subtitle: header.subtitle,
        actions: header.actions,
        search: header.search,
      }, headerOwner)
    },
    {
      immediate: true,
      flush: 'post',
    },
  )
})

onBeforeUnmount(() => {
  stopHeaderWatch?.()
  clearHeader(headerOwner)
})
</script>

<template>
  <span class="hidden" aria-hidden="true" />
</template>
