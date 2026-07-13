<script setup lang="ts">
import type { TableColumn } from '@/components/ui/table'
import type { ManagedArticleSummary } from '~~/shared/types/articles'

type CommentStatus = 'pending' | 'approved' | 'spam'
type CommentFilter = 'all' | CommentStatus
type CommentDestructiveAction = 'spam' | 'delete'

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
const PAGE_SIZE = 20
const commentColumns = [
  { prop: 'author', label: '评论者', width: 240, headerClass: 'px-6', cellClass: 'px-6 py-4 align-top' },
  { prop: 'content', label: '评论内容', minWidth: 360, cellClass: 'max-w-[30rem] py-4 align-top' },
  { prop: 'article', label: '关联文章', width: 208, cellClass: 'py-4 align-top' },
  { prop: 'status', label: '状态', width: 120, cellClass: 'py-4 align-top' },
  { prop: 'createdAt', label: '提交时间', width: 144, cellClass: 'py-4 align-top text-xs tabular-nums text-[var(--text-secondary)]', formatter: (_item, _column, value) => formatCommentDate(String(value)) },
  { prop: 'actions', label: '操作', width: 152, align: 'right', headerClass: 'px-6', cellClass: 'px-6 py-3 align-top' },
] satisfies readonly TableColumn[]
const statusFilters: ReadonlyArray<{
  value: CommentFilter
  label: string
}> = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已通过' },
  { value: 'spam', label: '垃圾' },
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
const pendingDestructiveAction = ref<{ comment: CommentItem, type: CommentDestructiveAction } | null>(null)
const { showSuccessToast, showErrorToast } = useAdminToast()

const { data, pending, error, refresh } = await useFetch<{ comments: CommentItem[] }>('/api/admin/features/comments')
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
const {
  discardDialogOpen,
  captureDraft,
  requestClose: requestEditClose,
  handleOpenChange: handleDialogOpenChange,
  discardDraft,
} = useDialogDraftGuard(editingCommentData, closeEditNow, () => saving.value)

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

function getCommentRowClass(item: object) {
  return (item as CommentItem).status === 'pending' ? 'bg-[var(--surface-low)]' : ''
}

function startEditComment(comment: CommentItem) {
  editingCommentId.value = comment.id
  editingCommentData.value = { ...comment }
  captureDraft()
  dialogOpen.value = true
}

function closeEditNow() {
  dialogOpen.value = false
  editingCommentId.value = ''
  editingCommentData.value = null
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

function requestDestructiveAction(comment: CommentItem, type: CommentDestructiveAction) {
  pendingDestructiveAction.value = { comment, type }
}

function handleDestructiveDialogOpenChange(value: boolean) {
  if (!value && !saving.value) {
    pendingDestructiveAction.value = null
  }
}

async function removeComment(id: string) {
  if (saving.value) {
    return
  }

  const saved = await persistComments(
    comments.value.filter(item => item.id !== id),
    '评论已删除',
  )

  if (saved && editingCommentId.value === id) {
    closeEditNow()
  }
}

async function confirmDestructiveAction() {
  const action = pendingDestructiveAction.value

  if (!action || saving.value) {
    return
  }

  if (action.type === 'delete') {
    await removeComment(action.comment.id)
  } else {
    await updateCommentStatus(action.comment.id, 'spam')
  }

  pendingDestructiveAction.value = null
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
    closeEditNow()
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

    <UiCard class="overflow-hidden p-0">
      <div class="flex flex-col items-stretch gap-3 border-b border-[var(--border-soft)] p-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-5 lg:p-5">
        <div class="flex shrink-0 items-center gap-2">
          <UiLabel for="comment-search" class="shrink-0 text-sm font-medium text-[var(--text-secondary)]">
            搜索
          </UiLabel>
          <UiInput
            id="comment-search"
            v-model="searchQuery"
            type="search"
            placeholder="搜索作者、邮箱、内容或文章"
            class="w-72 max-w-[60vw]"
            :disabled="pending"
          />
        </div>

        <div class="flex shrink-0 items-center gap-2">
          <UiLabel for="comment-status-filter" class="shrink-0 text-sm font-medium text-[var(--text-secondary)]">
            状态
          </UiLabel>
          <UiSelect v-model="statusFilter" :disabled="pending">
            <UiSelectTrigger id="comment-status-filter" class="w-40 max-w-[60vw]">
              <UiSelectValue placeholder="全部状态" />
            </UiSelectTrigger>
            <UiSelectContent>
              <UiSelectItem v-for="filter in statusFilters" :key="filter.value" :value="filter.value">
                {{ filter.label }}（{{ statusCounts[filter.value] }}）
              </UiSelectItem>
            </UiSelectContent>
          </UiSelect>
        </div>

        <div class="flex h-9 shrink-0 items-center gap-2 text-xs text-[var(--text-secondary)]">
          <Icon v-if="saving" name="lucide:loader-circle" class="size-3.5 animate-spin text-[var(--primary)]" />
          共 <strong class="font-semibold tabular-nums text-[var(--text-primary)]">{{ filteredComments.length }}</strong> 条
        </div>
      </div>

      <UiTable
        class="min-w-[1080px]"
        :columns="commentColumns"
        :items="paginatedComments"
        :row-class="getCommentRowClass"
        row-key="id"
        :loading="pending"
        loading-text="正在加载评论"
        :error="error?.message"
        empty-text="没有符合条件的评论，请调整搜索或状态筛选"
        pagination
        :page="currentPage"
        :items-per-page="PAGE_SIZE"
        :total="filteredComments.length"
        @retry="refresh"
        @update:page="goToPage"
      >
          <template #cell-author="{ item: comment }">
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
          </template>

          <template #cell-content="{ item: comment }">
            <p class="line-clamp-2 whitespace-pre-line break-words text-sm leading-6 text-[var(--text-primary)]" :title="comment.content">
              {{ comment.content || '—' }}
            </p>
            <p v-if="comment.updatedAt !== comment.createdAt" class="mt-1.5 text-[10px] text-[var(--text-muted)]">
              编辑于 {{ formatCommentDate(comment.updatedAt) }}
            </p>
          </template>

          <template #cell-article="{ item: comment }">
            <div class="flex items-start gap-2 text-[var(--text-secondary)]">
              <Icon name="lucide:file-text" class="mt-0.5 size-3.5 shrink-0" />
              <span class="line-clamp-2 text-xs leading-5" :title="getArticleDisplayName(comment.articleSlug)">
                {{ getArticleDisplayName(comment.articleSlug) }}
              </span>
            </div>
          </template>

          <template #cell-status="{ item: comment }">
            <UiBadge
              :variant="comment.status === 'approved' ? 'success' : comment.status === 'pending' ? 'warning' : 'outline'"
              :class="comment.status === 'spam' ? 'border-[var(--danger)]/25 bg-[var(--danger)]/10 text-[var(--danger)]' : ''"
            >
              <Icon :name="getStatusIcon(comment.status)" class="mr-1 size-3" />
              {{ getStatusLabel(comment.status) }}
            </UiBadge>
          </template>

          <template #cell-actions="{ item: comment }">
            <div class="flex justify-end gap-1">
              <UiTooltip>
                <UiTooltipTrigger as-child>
                  <UiButton
                    variant="ghost"
                    size="icon-sm"
                    :disabled="saving"
                    :aria-label="comment.status === 'approved' ? '撤回审核' : '批准评论'"
                    @click="updateCommentStatus(comment.id, comment.status === 'approved' ? 'pending' : 'approved')"
                  >
                    <Icon :name="comment.status === 'approved' ? 'lucide:undo-2' : 'lucide:check'" class="size-4" />
                  </UiButton>
                </UiTooltipTrigger>
                <UiTooltipContent>{{ comment.status === 'approved' ? '撤回审核' : '批准评论' }}</UiTooltipContent>
              </UiTooltip>

              <UiTooltip>
                <UiTooltipTrigger as-child>
                  <UiButton variant="ghost" size="icon-sm" :disabled="saving" aria-label="编辑评论" @click="startEditComment(comment)">
                    <Icon name="lucide:pencil" class="size-4" />
                  </UiButton>
                </UiTooltipTrigger>
                <UiTooltipContent>编辑评论</UiTooltipContent>
              </UiTooltip>

              <UiDropdownMenu>
                <UiTooltip>
                  <UiTooltipTrigger as-child>
                    <UiDropdownMenuTrigger as-child>
                      <UiButton variant="ghost" size="icon-sm" :disabled="saving" aria-label="更多评论操作">
                        <Icon name="lucide:ellipsis" class="size-4" />
                      </UiButton>
                    </UiDropdownMenuTrigger>
                  </UiTooltipTrigger>
                  <UiTooltipContent>更多操作</UiTooltipContent>
                </UiTooltip>
                <UiDropdownMenuContent align="end">
                  <UiDropdownMenuItem
                    v-if="comment.status !== 'spam'"
                    @select="requestDestructiveAction(comment, 'spam')"
                  >
                    <Icon name="lucide:shield-alert" />
                    标为垃圾评论
                  </UiDropdownMenuItem>
                  <UiDropdownMenuSeparator v-if="comment.status !== 'spam'" />
                  <UiDropdownMenuItem variant="destructive" @select="requestDestructiveAction(comment, 'delete')">
                    <Icon name="lucide:trash-2" />
                    永久删除
                  </UiDropdownMenuItem>
                </UiDropdownMenuContent>
              </UiDropdownMenu>
            </div>
          </template>
      </UiTable>
    </UiCard>

    <UiDialog :open="dialogOpen" @update:open="handleDialogOpenChange">
      <UiDialogContent size="lg" :show-close-button="!saving">
        <form v-if="editingCommentData" class="space-y-6" @submit.prevent="saveEditComment">
          <UiDialogHeader>
            <UiDialogTitle>编辑评论</UiDialogTitle>
            <UiDialogDescription>
              {{ editingCommentData.author || '匿名访客' }} · {{ getArticleDisplayName(editingCommentData.articleSlug) }}
            </UiDialogDescription>
          </UiDialogHeader>

          <div class="space-y-4 overflow-y-auto">
            <UiLabel class="block space-y-2">
              <span class="text-sm font-medium text-[var(--text-primary)]">作者</span>
              <UiInput v-model="editingCommentData.author" class="w-full max-w-xl" :disabled="saving" placeholder="评论者名称" />
            </UiLabel>

            <UiLabel class="block space-y-2">
              <span class="text-sm font-medium text-[var(--text-primary)]">邮箱</span>
              <UiInput v-model="editingCommentData.email" class="w-full max-w-xl" :disabled="saving" type="email" placeholder="name@example.com" />
            </UiLabel>

            <UiLabel class="block space-y-2">
              <span class="text-sm font-medium text-[var(--text-primary)]">关联文章</span>
              <UiSelect v-model="editingArticleSlug" :disabled="saving || articlesPending">
                <UiSelectTrigger class="w-full max-w-xl">
                  <UiSelectValue :placeholder="articlesPending ? '正在加载文章...' : '选择文章'" />
                </UiSelectTrigger>
                <UiSelectContent>
                  <UiSelectItem :value="ARTICLE_NONE_VALUE">未关联文章</UiSelectItem>
                  <UiSelectItem v-for="article in editableArticleOptions" :key="article.slug" :value="article.slug">
                    {{ article.title }}
                  </UiSelectItem>
                </UiSelectContent>
              </UiSelect>
            </UiLabel>

            <UiLabel class="block space-y-2">
              <span class="text-sm font-medium text-[var(--text-primary)]">状态</span>
              <UiSelect v-model="editingCommentData.status" :disabled="saving">
                <UiSelectTrigger class="w-full max-w-xl">
                  <UiSelectValue placeholder="选择状态" />
                </UiSelectTrigger>
                <UiSelectContent>
                  <UiSelectItem value="pending">待审核</UiSelectItem>
                  <UiSelectItem value="approved">已通过</UiSelectItem>
                  <UiSelectItem value="spam" disabled>垃圾（请使用更多操作）</UiSelectItem>
                </UiSelectContent>
              </UiSelect>
            </UiLabel>

            <UiLabel class="block space-y-2">
              <span class="text-sm font-medium text-[var(--text-primary)]">评论内容</span>
              <UiTextarea v-model="editingCommentData.content" class="max-w-xl" :disabled="saving" placeholder="评论内容" />
            </UiLabel>
          </div>

          <UiDialogFooter>
            <UiButton type="button" variant="outline" :disabled="saving" @click="requestEditClose">取消</UiButton>
            <UiButton type="submit" :disabled="saving">
              <Icon :name="saving ? 'lucide:loader-circle' : 'lucide:save'" :class="['size-4', saving && 'animate-spin']" />
              {{ saving ? '保存中...' : '保存修改' }}
            </UiButton>
          </UiDialogFooter>
        </form>
      </UiDialogContent>
    </UiDialog>

    <AdminDiscardChangesDialog v-model:open="discardDialogOpen" @confirm="discardDraft" />

    <UiAlertDialog :open="Boolean(pendingDestructiveAction)" @update:open="handleDestructiveDialogOpenChange">
      <UiAlertDialogContent>
        <UiAlertDialogHeader>
          <UiAlertDialogTitle>
            {{ pendingDestructiveAction?.type === 'delete' ? '永久删除这条评论？' : '将这条评论标为垃圾？' }}
          </UiAlertDialogTitle>
          <UiAlertDialogDescription>
            {{ pendingDestructiveAction?.type === 'delete'
              ? '删除后无法恢复，请确认不再需要这条评论。'
              : '评论将从正常审核队列中移出，之后仍可重新批准。' }}
          </UiAlertDialogDescription>
        </UiAlertDialogHeader>
        <UiAlertDialogFooter>
          <UiAlertDialogCancel :disabled="saving">取消</UiAlertDialogCancel>
          <UiAlertDialogAction variant="destructive" :disabled="saving" @click="confirmDestructiveAction">
            {{ saving ? '处理中...' : pendingDestructiveAction?.type === 'delete' ? '永久删除' : '标为垃圾' }}
          </UiAlertDialogAction>
        </UiAlertDialogFooter>
      </UiAlertDialogContent>
    </UiAlertDialog>
  </div>
</template>
