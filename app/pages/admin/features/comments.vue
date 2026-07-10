<script setup lang="ts">
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from 'reka-ui'
import type { ManagedArticleSummary } from '~~/shared/types/articles'

type CommentStatus = 'pending' | 'approved' | 'spam'
type CommentFilter = 'all' | CommentStatus

interface CommentItem {
  id: string
  author: string
  email: string
  articleSlug: string
  content: string
  status: CommentStatus
  createdAt: string
  updatedAt: string
}

const ARTICLE_NONE_VALUE = '__none__'
const PAGE_SIZE = 10
const statusFilters: ReadonlyArray<{
  value: CommentFilter
  label: string
  icon: string
}> = [
  { value: 'all', label: '全部', icon: 'lucide:messages-square' },
  { value: 'pending', label: '待审核', icon: 'lucide:clock-3' },
  { value: 'approved', label: '已通过', icon: 'lucide:circle-check' },
  { value: 'spam', label: '垃圾', icon: 'lucide:shield-alert' },
]

definePageMeta({
  layout: 'admin',
})

useSeoMeta({
  title: '评论管理',
  description: '审核、标记和删除评论。',
})

const saving = ref(false)
const statusFilter = ref<CommentFilter>('all')
const searchQuery = ref('')
const currentPage = ref(1)
const dialogOpen = ref(false)
const { showSuccessToast, showErrorToast } = useAdminToast()

const { data, pending, error } = await useFetch<{ comments: CommentItem[] }>('/api/admin/features/comments')
const { data: articleData, pending: articlesPending } = await useFetch<{ articles: ManagedArticleSummary[] }>('/api/admin/articles', {
  default: () => ({ articles: [] }),
  query: {
    page: 1,
    page_size: 100,
  },
})
const comments = ref<CommentItem[]>([])
const editingCommentId = ref('')
const editingCommentData = ref<CommentItem | null>(null)

watch(data, (value) => {
  comments.value = (value?.comments || []).map(item => ({ ...item }))
}, { immediate: true })

const articleOptions = computed(() => (articleData.value?.articles || [])
  .filter(article => article.slug)
  .map(article => ({
    slug: article.slug,
    title: article.title || article.slug,
  })))

const editableArticleOptions = computed(() => {
  const options = [...articleOptions.value]
  const selectedSlug = editingCommentData.value?.articleSlug

  if (selectedSlug && !options.some(article => article.slug === selectedSlug)) {
    options.push({
      slug: selectedSlug,
      title: selectedSlug,
    })
  }

  return options
})

const articleTitleBySlug = computed(() => {
  return new Map(articleOptions.value.map(article => [article.slug, article.title]))
})

const editingArticleSlug = computed({
  get() {
    return editingCommentData.value?.articleSlug || ARTICLE_NONE_VALUE
  },
  set(value: string) {
    if (editingCommentData.value) {
      editingCommentData.value.articleSlug = value === ARTICLE_NONE_VALUE ? '' : value
    }
  },
})

const statusCounts = computed<Record<CommentFilter, number>>(() => {
  const counts: Record<CommentFilter, number> = {
    all: comments.value.length,
    pending: 0,
    approved: 0,
    spam: 0,
  }

  comments.value.forEach((comment) => {
    counts[comment.status] += 1
  })

  return counts
})

const filteredComments = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase('zh-CN')

  return comments.value.filter((comment) => {
    if (statusFilter.value !== 'all' && comment.status !== statusFilter.value) {
      return false
    }

    if (!query) {
      return true
    }

    const searchableText = [
      comment.author,
      comment.email,
      comment.content,
      comment.articleSlug,
      getArticleDisplayName(comment.articleSlug),
    ].join(' ').toLocaleLowerCase('zh-CN')

    return searchableText.includes(query)
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredComments.value.length / PAGE_SIZE)))

const paginatedComments = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredComments.value.slice(start, start + PAGE_SIZE)
})

const pageStart = computed(() => {
  if (!filteredComments.value.length) {
    return 0
  }

  return (currentPage.value - 1) * PAGE_SIZE + 1
})

const pageEnd = computed(() => Math.min(currentPage.value * PAGE_SIZE, filteredComments.value.length))

watch([statusFilter, searchQuery], () => {
  currentPage.value = 1
})

watch(totalPages, (value) => {
  currentPage.value = Math.min(currentPage.value, value)
})

const headerActions = computed(() => [
  {
    label: '新增示例',
    icon: 'lucide:plus',
    variant: 'secondary' as const,
    disabled: saving.value || pending.value,
    onClick: addComment,
  },
])

watch(error, (value) => {
  if (value) {
    showErrorToast('评论加载失败', value.message)
  }
}, { immediate: true })

function createLocalId() {
  return globalThis.crypto?.randomUUID?.() || `comment-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function getArticleDisplayName(slug: string) {
  return slug ? articleTitleBySlug.value.get(slug) || slug : '未关联文章'
}

function getCommentInitial(author: string) {
  return author.trim().charAt(0).toLocaleUpperCase('zh-CN') || '访'
}

function getStatusLabel(status: CommentStatus) {
  return status === 'approved' ? '已通过' : status === 'spam' ? '垃圾' : '待审核'
}

function getStatusIcon(status: CommentStatus) {
  return status === 'approved' ? 'lucide:circle-check' : status === 'spam' ? 'lucide:shield-alert' : 'lucide:clock-3'
}

function formatCommentDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Shanghai',
  }).format(date)
}

function goToPage(nextPage: number) {
  currentPage.value = Math.min(Math.max(1, nextPage), totalPages.value)
}

function startEditComment(comment: CommentItem) {
  editingCommentId.value = comment.id
  editingCommentData.value = { ...comment }
  dialogOpen.value = true
}

function cancelEditComment() {
  dialogOpen.value = false
  editingCommentId.value = ''
  editingCommentData.value = null
}

function handleDialogOpenChange(value: boolean) {
  if (!value && saving.value) {
    return
  }

  dialogOpen.value = value

  if (!value) {
    editingCommentId.value = ''
    editingCommentData.value = null
  }
}

async function addComment() {
  if (saving.value) {
    return
  }

  const now = new Date().toISOString()
  const comment: CommentItem = {
    id: createLocalId(),
    author: '匿名访客',
    email: '',
    articleSlug: articleOptions.value[0]?.slug || '',
    content: '这是一条待审核评论。',
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  }
  const saved = await persistComments([comment, ...comments.value], '评论已创建')

  if (saved) {
    statusFilter.value = 'all'
    searchQuery.value = ''
    currentPage.value = 1
  }
}

async function removeComment(id: string) {
  if (saving.value) {
    return
  }

  if (import.meta.client && !window.confirm('确认永久删除这条评论吗？')) {
    return
  }

  const saved = await persistComments(
    comments.value.filter(item => item.id !== id),
    '评论已删除',
  )

  if (saved && editingCommentId.value === id) {
    cancelEditComment()
  }
}

async function updateCommentStatus(id: string, status: CommentStatus) {
  if (saving.value) {
    return
  }

  const comment = comments.value.find(item => item.id === id)

  if (comment) {
    await persistComments(
      comments.value.map(item => item.id === id ? { ...item, status } : item),
      status === 'approved' ? '评论已通过' : status === 'spam' ? '评论已标记为垃圾' : '评论已驳回',
    )
  }
}

async function saveEditComment() {
  const editedComment = editingCommentData.value

  if (!editedComment || saving.value) {
    return
  }

  const index = comments.value.findIndex(comment => comment.id === editingCommentId.value)

  if (index === -1) {
    showErrorToast('保存失败', '评论不存在或已被删除')
    return
  }

  const saved = await persistComments(
    comments.value.map(item => item.id === editingCommentId.value ? { ...editedComment } : item),
    '评论已更新',
  )

  if (saved) {
    cancelEditComment()
  }
}

async function persistComments(nextComments: CommentItem[], successMessage: string) {
  if (saving.value) {
    return false
  }

  saving.value = true

  try {
    const response = await $fetch<{ comments: CommentItem[] }>('/api/admin/features/comments', {
      method: 'PUT',
      body: {
        comments: nextComments,
      },
    })

    comments.value = response.comments.map(item => ({ ...item }))
    showSuccessToast(successMessage)
    return true
  } catch (err) {
    showErrorToast('保存失败', getRequestErrorMessage(err, '保存失败'))
    return false
  } finally {
    saving.value = false
  }
}
</script>
<template>
  <div class="cms-page space-y-3">
    <AdminPageHeader title="评论管理" subtitle="" :actions="headerActions" />

    <div v-if="pending" class="flex min-h-64 items-center justify-center rounded-lg border border-[var(--border-soft)] bg-[var(--surface-card)]">
      <div class="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
        <Icon name="lucide:loader-circle" class="size-4 animate-spin" />
        正在加载评论...
      </div>
    </div>

    <UiCard v-else class="overflow-hidden p-0">
      <div class="flex flex-col gap-4 border-b border-[var(--border-soft)] px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div class="flex items-center gap-2">
            <p class="text-sm font-semibold text-[var(--text-primary)]">
              评论列表
            </p>
            <Icon v-if="saving" name="lucide:loader-circle" class="size-3.5 animate-spin text-[var(--primary)]" />
          </div>
          <p class="mt-1 text-xs text-[var(--text-secondary)]">
            审核访客留言并管理关联文章
          </p>
        </div>

        <div class="relative w-full lg:w-72">
          <Icon name="lucide:search" class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <UiInput
            v-model="searchQuery"
            type="search"
            placeholder="搜索作者、邮箱、内容或文章"
            class="h-9 pl-9 text-xs"
          />
        </div>
      </div>

      <div class="flex flex-col gap-3 border-b border-[var(--border-soft)] bg-[var(--surface-low)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex max-w-full items-center gap-1 overflow-x-auto rounded-lg border border-[var(--border-soft)] bg-[var(--surface-card)] p-1 [scrollbar-width:none]">
          <button
            v-for="filter in statusFilters"
            :key="filter.value"
            type="button"
            :class="[
              'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]',
              statusFilter === filter.value
                ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-sm'
                : 'text-[var(--text-secondary)] hover:bg-[var(--surface-high)] hover:text-[var(--text-primary)]',
            ]"
            @click="statusFilter = filter.value"
          >
            <Icon :name="filter.icon" class="size-3.5" />
            {{ filter.label }}
            <span
              :class="[
                'min-w-5 rounded px-1 py-0.5 text-center text-[10px] tabular-nums',
                statusFilter === filter.value
                  ? 'bg-white/15 text-inherit'
                  : 'bg-[var(--surface-high)] text-[var(--text-secondary)]',
              ]"
            >
              {{ statusCounts[filter.value] }}
            </span>
          </button>
        </div>

        <p class="shrink-0 text-xs tabular-nums text-[var(--text-secondary)]">
          共 {{ filteredComments.length }} 条结果
        </p>
      </div>

      <div v-if="!filteredComments.length" class="flex min-h-64 flex-col items-center justify-center px-6 py-14 text-center">
        <div class="flex size-10 items-center justify-center rounded-lg bg-[var(--surface-high)] text-[var(--text-secondary)]">
          <Icon name="lucide:message-square-off" class="size-5" />
        </div>
        <p class="mt-4 text-sm font-semibold text-[var(--text-primary)]">
          没有符合条件的评论
        </p>
        <p class="mt-1 text-xs text-[var(--text-secondary)]">
          调整状态筛选或搜索内容
        </p>
      </div>

      <template v-else>
        <UiTable class="min-w-[1080px]">
          <UiTableHeader>
            <UiTableRow class="hover:bg-transparent">
              <UiTableHead class="w-[15rem] px-6">
                评论者
              </UiTableHead>
              <UiTableHead>
                评论内容
              </UiTableHead>
              <UiTableHead class="w-[13rem]">
                关联文章
              </UiTableHead>
              <UiTableHead class="w-[7.5rem]">
                状态
              </UiTableHead>
              <UiTableHead class="w-[9rem]">
                提交时间
              </UiTableHead>
              <UiTableHead class="w-[11rem] px-6 text-right">
                操作
              </UiTableHead>
            </UiTableRow>
          </UiTableHeader>

          <UiTableBody>
            <UiTableRow
              v-for="comment in paginatedComments"
              :key="comment.id"
              :class="comment.status === 'pending' ? 'bg-[var(--surface-low)]' : ''"
            >
              <UiTableCell class="px-6 py-4 align-top">
                <div class="flex min-w-0 items-start gap-3">
                  <div class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-sm font-bold text-[var(--primary)]">
                    {{ getCommentInitial(comment.author) }}
                  </div>
                  <div class="min-w-0 pt-0.5">
                    <p class="max-w-40 truncate font-semibold text-[var(--text-primary)]">
                      {{ comment.author || '匿名访客' }}
                    </p>
                    <a
                      v-if="comment.email"
                      :href="`mailto:${comment.email}`"
                      class="mt-1 block max-w-40 truncate text-xs text-[var(--text-secondary)] transition-colors hover:text-[var(--primary)]"
                      :title="comment.email"
                    >
                      {{ comment.email }}
                    </a>
                    <span v-else class="mt-1 block text-xs text-[var(--text-muted)]">未留邮箱</span>
                  </div>
                </div>
              </UiTableCell>

              <UiTableCell class="max-w-[30rem] py-4 align-top">
                <p class="line-clamp-2 whitespace-pre-line break-words text-sm leading-6 text-[var(--text-primary)]" :title="comment.content">
                  {{ comment.content || '—' }}
                </p>
                <p v-if="comment.updatedAt !== comment.createdAt" class="mt-1.5 text-[10px] text-[var(--text-muted)]">
                  编辑于 {{ formatCommentDate(comment.updatedAt) }}
                </p>
              </UiTableCell>

              <UiTableCell class="py-4 align-top">
                <div class="flex items-start gap-2 text-[var(--text-secondary)]">
                  <Icon name="lucide:file-text" class="mt-0.5 size-3.5 shrink-0" />
                  <span class="line-clamp-2 text-xs leading-5" :title="getArticleDisplayName(comment.articleSlug)">
                    {{ getArticleDisplayName(comment.articleSlug) }}
                  </span>
                </div>
              </UiTableCell>

              <UiTableCell class="py-4 align-top">
                <UiBadge
                  :variant="comment.status === 'approved' ? 'success' : comment.status === 'pending' ? 'warning' : 'outline'"
                  :class="comment.status === 'spam' ? 'border-red-500/25 bg-red-500/10 text-red-600 dark:text-red-400' : ''"
                >
                  <Icon :name="getStatusIcon(comment.status)" class="mr-1 size-3" />
                  {{ getStatusLabel(comment.status) }}
                </UiBadge>
              </UiTableCell>

              <UiTableCell class="py-4 align-top text-xs tabular-nums text-[var(--text-secondary)]">
                {{ formatCommentDate(comment.createdAt) }}
              </UiTableCell>

              <UiTableCell class="px-6 py-3 align-top">
                <div class="flex justify-end gap-1">
                  <UiButton
                    v-if="comment.status !== 'approved'"
                    variant="ghost"
                    size="icon"
                    class="size-8 text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
                    :disabled="saving"
                    aria-label="批准评论"
                    title="批准评论"
                    @click="updateCommentStatus(comment.id, 'approved')"
                  >
                    <Icon name="lucide:check" class="size-4" />
                  </UiButton>
                  <UiButton
                    v-else
                    variant="ghost"
                    size="icon"
                    class="size-8 text-amber-600 hover:text-amber-500 dark:text-amber-400"
                    :disabled="saving"
                    aria-label="撤回审核"
                    title="撤回审核"
                    @click="updateCommentStatus(comment.id, 'pending')"
                  >
                    <Icon name="lucide:undo-2" class="size-4" />
                  </UiButton>
                  <UiButton
                    variant="ghost"
                    size="icon"
                    class="size-8 text-[var(--text-secondary)]"
                    :disabled="saving"
                    aria-label="编辑评论"
                    title="编辑评论"
                    @click="startEditComment(comment)"
                  >
                    <Icon name="lucide:pencil" class="size-4" />
                  </UiButton>
                  <UiButton
                    v-if="comment.status !== 'spam'"
                    variant="ghost"
                    size="icon"
                    class="size-8 text-orange-600 hover:text-orange-500 dark:text-orange-400"
                    :disabled="saving"
                    aria-label="标为垃圾评论"
                    title="标为垃圾评论"
                    @click="updateCommentStatus(comment.id, 'spam')"
                  >
                    <Icon name="lucide:shield-alert" class="size-4" />
                  </UiButton>
                  <UiButton
                    variant="ghost"
                    size="icon"
                    class="size-8 text-red-600 hover:text-red-500 dark:text-red-400"
                    :disabled="saving"
                    aria-label="永久删除评论"
                    title="永久删除评论"
                    @click="removeComment(comment.id)"
                  >
                    <Icon name="lucide:trash-2" class="size-4" />
                  </UiButton>
                </div>
              </UiTableCell>
            </UiTableRow>
          </UiTableBody>
        </UiTable>

        <div class="flex flex-col gap-3 border-t border-[var(--border-soft)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p class="text-xs tabular-nums text-[var(--text-secondary)]">
            显示 {{ pageStart }} - {{ pageEnd }} / {{ filteredComments.length }}
          </p>
          <UiPagination
            v-if="filteredComments.length > PAGE_SIZE"
            :page="currentPage"
            :items-per-page="PAGE_SIZE"
            :total="filteredComments.length"
            :sibling-count="1"
            show-edges
            @update:page="goToPage"
          >
            <UiPaginationPrev>
              <Icon name="lucide:chevron-left" class="size-4" />
              上一页
            </UiPaginationPrev>
            <UiPaginationList v-slot="{ items }">
              <template
                v-for="(item, index) in items"
                :key="item.type === 'page' ? item.value : `ellipsis-${index}`"
              >
                <UiPaginationListItem v-if="item.type === 'page'" :value="item.value">
                  {{ item.value }}
                </UiPaginationListItem>
                <UiPaginationEllipsis v-else />
              </template>
            </UiPaginationList>
            <UiPaginationNext>
              下一页
              <Icon name="lucide:chevron-right" class="size-4" />
            </UiPaginationNext>
          </UiPagination>
        </div>
      </template>
    </UiCard>

    <DialogRoot :open="dialogOpen" @update:open="handleDialogOpenChange">
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 z-[120] bg-slate-950/40 backdrop-blur-sm" />
        <DialogContent class="fixed left-1/2 top-1/2 z-[121] flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl bg-[var(--surface-card)] shadow-lg outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">
          <form v-if="editingCommentData" class="flex min-h-0 flex-1 flex-col" @submit.prevent="saveEditComment">
            <div class="flex shrink-0 items-center justify-between border-b border-[var(--border-soft)] px-6 py-5">
              <div class="flex min-w-0 items-center gap-3">
                <div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]">
                  <Icon name="lucide:message-square-text" class="size-5" />
                </div>
                <div class="min-w-0">
                  <DialogTitle class="text-base font-semibold text-[var(--text-primary)]">
                    编辑评论
                  </DialogTitle>
                  <DialogDescription class="mt-0.5 truncate text-xs text-[var(--text-secondary)]">
                    {{ editingCommentData.author || '匿名访客' }} · {{ getArticleDisplayName(editingCommentData.articleSlug) }}
                  </DialogDescription>
                </div>
              </div>
              <DialogClose as-child>
                <UiButton type="button" variant="ghost" size="icon" class="size-8" aria-label="关闭弹窗" title="关闭" :disabled="saving">
                  <Icon name="lucide:x" class="size-4" />
                </UiButton>
              </DialogClose>
            </div>

            <div class="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <UiLabel class="grid gap-2 sm:grid-cols-[7rem_minmax(0,1fr)] sm:items-center sm:gap-4">
                <span class="text-sm font-medium text-[var(--text-primary)]">作者</span>
                <UiInput v-model="editingCommentData.author" :disabled="saving" placeholder="评论者名称" />
              </UiLabel>

              <UiLabel class="grid gap-2 sm:grid-cols-[7rem_minmax(0,1fr)] sm:items-center sm:gap-4">
                <span class="text-sm font-medium text-[var(--text-primary)]">邮箱</span>
                <UiInput v-model="editingCommentData.email" :disabled="saving" type="email" placeholder="name@example.com" />
              </UiLabel>

              <UiLabel class="grid gap-2 sm:grid-cols-[7rem_minmax(0,1fr)] sm:items-center sm:gap-4">
                <span class="text-sm font-medium text-[var(--text-primary)]">关联文章</span>
                <UiSelect v-model="editingArticleSlug" :disabled="saving || articlesPending">
                  <UiSelectTrigger>
                    <UiSelectValue :placeholder="articlesPending ? '正在加载文章...' : '选择文章'" />
                  </UiSelectTrigger>
                  <UiSelectContent>
                    <UiSelectItem :value="ARTICLE_NONE_VALUE">
                      未关联文章
                    </UiSelectItem>
                    <UiSelectItem
                      v-for="article in editableArticleOptions"
                      :key="article.slug"
                      :value="article.slug"
                    >
                      {{ article.title }}
                    </UiSelectItem>
                  </UiSelectContent>
                </UiSelect>
              </UiLabel>

              <UiLabel class="grid gap-2 sm:grid-cols-[7rem_minmax(0,1fr)] sm:items-center sm:gap-4">
                <span class="text-sm font-medium text-[var(--text-primary)]">状态</span>
                <UiSelect v-model="editingCommentData.status" :disabled="saving">
                  <UiSelectTrigger>
                    <UiSelectValue placeholder="选择状态" />
                  </UiSelectTrigger>
                  <UiSelectContent>
                    <UiSelectItem value="pending">待审核</UiSelectItem>
                    <UiSelectItem value="approved">已通过</UiSelectItem>
                    <UiSelectItem value="spam">垃圾</UiSelectItem>
                  </UiSelectContent>
                </UiSelect>
              </UiLabel>

              <UiLabel class="grid gap-2 sm:grid-cols-[7rem_minmax(0,1fr)] sm:items-start sm:gap-4">
                <span class="pt-3 text-sm font-medium text-[var(--text-primary)]">评论内容</span>
                <UiTextarea v-model="editingCommentData.content" :disabled="saving" class="min-h-32 resize-y" placeholder="评论内容" />
              </UiLabel>
            </div>

            <div class="flex shrink-0 items-center justify-end gap-2 border-t border-[var(--border-soft)] px-6 py-4">
              <UiButton type="button" variant="ghost" :disabled="saving" @click="cancelEditComment">
                取消
              </UiButton>
              <UiButton type="submit" :disabled="saving">
                <Icon :name="saving ? 'lucide:loader-circle' : 'lucide:save'" :class="['size-4', saving && 'animate-spin']" />
                {{ saving ? '保存中...' : '保存修改' }}
              </UiButton>
            </div>
          </form>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </div>
</template>
