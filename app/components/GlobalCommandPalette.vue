<script setup lang="ts">
import { primaryNavigation } from '@/utils/siteSections'

interface SearchResult {
  id: string
  title: string
  summary: string
  excerpt: string
  path: string
}

interface PaletteItem {
  id: string
  title: string
  description: string
  path: string
  type: 'article' | 'page' | 'admin'
  icon: string
}

const open = ref(false)
const query = ref('')
const loading = ref(false)
const remoteResults = ref<SearchResult[]>([])
const activeIndex = ref(0)
const inputRef = useTemplateRef<HTMLInputElement>('inputRef')
const openPaletteEvent = 'mayday:open-command-palette'
let searchTimer: number | null = null
let searchRequestId = 0

const staticItems: PaletteItem[] = [
  { id: 'page-home', title: '主页', description: '回到 Mayday Archive 首页', path: '/', type: 'page', icon: 'lucide:home' },
  ...primaryNavigation.map(item => ({
    id: `page-${item.path}`,
    title: item.title,
    description: `打开 ${item.title}`,
    path: item.path,
    type: 'page' as const,
    icon: 'lucide:compass',
  })),
  { id: 'admin-dashboard', title: '后台仪表盘', description: '进入内容管理后台', path: '/admin', type: 'admin', icon: 'lucide:layout-dashboard' },
  { id: 'admin-new-post', title: '新建文章', description: '快速创建一篇博客文章', path: '/admin/articles/new', type: 'admin', icon: 'lucide:file-plus-2' },
  { id: 'admin-site', title: '站点设置', description: '维护站点名称、首页文案和全局配置', path: '/admin/features/site', type: 'admin', icon: 'lucide:sliders-horizontal' },
]

const normalizedQuery = computed(() => query.value.trim().toLowerCase())
const localResults = computed(() => {
  if (!normalizedQuery.value) {
    return staticItems
  }

  return staticItems.filter((item) => {
    return `${item.title} ${item.description}`.toLowerCase().includes(normalizedQuery.value)
  })
})
const articleItems = computed<PaletteItem[]>(() => remoteResults.value.map(item => ({
  id: `article-${item.id}`,
  title: item.title,
  description: item.excerpt || item.summary || '打开文章',
  path: item.path,
  type: 'article',
  icon: 'lucide:file-text',
})))
const paletteItems = computed(() => [...localResults.value, ...articleItems.value].slice(0, 12))

watch(paletteItems, () => {
  activeIndex.value = 0
})

watch(open, async (value) => {
  if (value) {
    await nextTick()
    inputRef.value?.focus()
    void fetchResults()
  } else {
    query.value = ''
  }
})

watch(query, () => {
  if (!open.value) {
    return
  }

  if (searchTimer) {
    window.clearTimeout(searchTimer)
  }

  searchTimer = window.setTimeout(() => {
    void fetchResults()
  }, 120)
})

async function fetchResults() {
  const requestId = searchRequestId + 1
  searchRequestId = requestId
  loading.value = true

  try {
    const response = await $fetch<{ results: SearchResult[] }>('/api/search', {
      query: {
        q: query.value.trim(),
      },
    })
    if (requestId !== searchRequestId) {
      return
    }
    remoteResults.value = response.results
  } catch {
    if (requestId === searchRequestId) {
      remoteResults.value = []
    }
  } finally {
    if (requestId === searchRequestId) {
      loading.value = false
    }
  }
}

function openPalette() {
  open.value = true
}

function togglePalette() {
  open.value = !open.value
}

function closePalette() {
  open.value = false
}

async function selectItem(item: PaletteItem) {
  closePalette()
  await navigateTo(item.path)
}

function handleGlobalKeydown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    togglePalette()
  }
}

function handlePaletteKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    closePalette()
    return
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    activeIndex.value = Math.min(activeIndex.value + 1, Math.max(paletteItems.value.length - 1, 0))
    return
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault()
    activeIndex.value = Math.max(activeIndex.value - 1, 0)
    return
  }

  if (event.key === 'Enter') {
    event.preventDefault()
    const item = paletteItems.value[activeIndex.value]
    if (item) {
      void selectItem(item)
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
  window.addEventListener(openPaletteEvent, openPalette)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
  window.removeEventListener(openPaletteEvent, openPalette)
  if (searchTimer) {
    window.clearTimeout(searchTimer)
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-[160ms] ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-[120ms] ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-[90] bg-slate-950/[0.28] px-4 pt-[12vh] backdrop-blur-sm"
        @click.self="closePalette"
        @keydown="handlePaletteKeydown"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="全局快捷搜索"
          class="mx-auto max-w-2xl overflow-hidden rounded-[1.4rem] border border-white/[0.18] bg-white/[0.82] shadow-[0_30px_100px_-40px_rgba(15,23,42,0.65)] backdrop-blur-2xl dark:bg-zinc-950/[0.82]"
        >
          <div class="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
            <Icon name="lucide:search" class="size-5 text-[var(--text-secondary)]" />
            <input
              ref="inputRef"
              v-model="query"
              type="search"
              placeholder="搜索文章、页面或后台设置"
              class="h-10 min-w-0 flex-1 bg-transparent text-base text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
            >
            <kbd class="hidden rounded-md border border-[var(--border)] px-2 py-1 text-[11px] font-semibold text-[var(--text-secondary)] sm:inline">
              Esc
            </kbd>
          </div>

          <div class="max-h-[24rem] overflow-y-auto p-2">
            <button
              v-for="(item, index) in paletteItems"
              :key="item.id"
              type="button"
              class="flex w-full items-center gap-3 rounded-[1rem] px-3 py-3 text-left transition-colors"
              :class="index === activeIndex ? 'bg-black/[0.07] dark:bg-white/10' : 'hover:bg-black/5 dark:hover:bg-white/[0.07]'"
              @mouseenter="activeIndex = index"
              @click="selectItem(item)"
            >
              <span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-low)] text-[var(--text-primary)]">
                <Icon :name="item.icon" class="size-4" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-semibold text-[var(--text-primary)]">{{ item.title }}</span>
                <span class="mt-0.5 block truncate text-xs text-[var(--text-secondary)]">{{ item.description }}</span>
              </span>
              <span class="rounded-full border border-[var(--border)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                {{ item.type }}
              </span>
            </button>

            <div v-if="!paletteItems.length" class="px-4 py-10 text-center text-sm text-[var(--text-secondary)]">
              {{ loading ? '正在搜索...' : '没有找到结果' }}
            </div>
          </div>

          <div class="flex items-center justify-between border-t border-[var(--border)] px-4 py-2 text-[11px] text-[var(--text-secondary)]">
            <span>↑↓ 选择</span>
            <span>Enter 打开</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
