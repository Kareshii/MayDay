<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const loggingOut = ref(false)
const searchInput = ref('')

const emit = defineEmits<{
  toggle: []
}>()

const isArticlesListPage = computed(() => route.path === '/admin/articles')

watch(
  () => [route.path, route.query.search],
  () => {
    if (!isArticlesListPage.value) {
      searchInput.value = ''
      return
    }

    searchInput.value = typeof route.query.search === 'string' ? route.query.search : ''
  },
  { immediate: true },
)

watch(searchInput, async (value) => {
  if (!isArticlesListPage.value) {
    return
  }

  const trimmed = value.trim()
  const currentSearch = typeof route.query.search === 'string' ? route.query.search : ''

  if (trimmed === currentSearch) {
    return
  }

  const nextQuery: Record<string, string> = {}
  if (trimmed) {
    nextQuery.search = trimmed
  }

  const currentStatus = typeof route.query.status === 'string' ? route.query.status : ''
  if (currentStatus && currentStatus !== 'all') {
    nextQuery.status = currentStatus
  }

  await router.replace({ query: nextQuery })
})

async function signOut() {
  loggingOut.value = true

  try {
    await $fetch('/api/admin/logout', {
      method: 'POST',
    })

    await navigateTo('/admin/login')
  } finally {
    loggingOut.value = false
  }
}
</script>

<template>
  <header class="sticky top-0 z-30 border-b border-[var(--border-soft)] bg-[var(--surface-card)]/72 backdrop-blur-xl">
    <div class="mx-auto flex h-16 w-full max-w-[1200px] items-center gap-4 px-4 lg:px-6">
      <UiButton variant="ghost" size="icon" class="lg:hidden" @click="emit('toggle')">
        <Icon name="lucide:menu" class="size-5" />
      </UiButton>

      <div class="min-w-0 flex-1">
        <label v-if="isArticlesListPage" class="relative block max-w-[22rem]">
          <Icon name="lucide:search" class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            v-model="searchInput"
            type="search"
            placeholder="搜索文章..."
            class="h-10 w-full rounded-xl border border-[var(--border-soft)] bg-[var(--surface-low)] pl-10 pr-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-secondary)]/85 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--focus-ring)]"
          >
        </label>

        <p v-else class="text-sm font-medium text-[var(--text-secondary)]">
          Architectural Curator Workspace
        </p>
      </div>

      <div class="ml-auto flex items-center gap-2.5">
        <NuxtLink to="/" class="hidden text-sm font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)] md:inline-flex">
          查看前台
        </NuxtLink>
        <ColorModeSwitch class="text-[var(--text-primary)]" />
        <UiButton variant="outline" size="sm" :disabled="loggingOut" @click="signOut">
          {{ loggingOut ? '退出中...' : '退出登录' }}
        </UiButton>
      </div>
    </div>
  </header>
</template>
