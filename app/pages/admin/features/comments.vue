<script setup lang="ts">
type CommentStatus = 'pending' | 'approved' | 'spam'

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

definePageMeta({
  layout: 'admin',
})

useSeoMeta({
  title: '评论管理',
  description: '审核、标记和删除评论。',
})

const saving = ref(false)
const statusFilter = ref<'all' | CommentStatus>('all')
const { showSuccessToast, showErrorToast } = useAdminToast()

const { data, pending, error, refresh } = await useFetch<{ comments: CommentItem[] }>('/api/admin/features')
const comments = ref<CommentItem[]>([])

watch(data, (value) => {
  comments.value = (value?.comments || []).map(item => ({ ...item }))
}, { immediate: true })

const filteredComments = computed(() => {
  return statusFilter.value === 'all'
    ? comments.value
    : comments.value.filter(comment => comment.status === statusFilter.value)
})

function createLocalId() {
  return globalThis.crypto?.randomUUID?.() || `comment-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function addComment() {
  const now = new Date().toISOString()
  comments.value.unshift({
    id: createLocalId(),
    author: '匿名访客',
    email: '',
    articleSlug: '',
    content: '这是一条待审核评论。',
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  })
  statusFilter.value = 'all'
}

function removeComment(id: string) {
  comments.value = comments.value.filter(item => item.id !== id)
}

function updateCommentStatus(id: string, status: CommentStatus) {
  const index = comments.value.findIndex(c => c.id === id)
  if (index !== -1) {
    comments.value[index].status = status
  }
}

// Quick Edit state
const editingCommentId = ref<string>('')
const editingCommentData = ref<CommentItem | null>(null)

function startEditComment(comment: CommentItem) {
  editingCommentId.value = comment.id
  editingCommentData.value = { ...comment }
}

function cancelEditComment() {
  editingCommentId.value = ''
  editingCommentData.value = null
}

function saveEditComment() {
  if (!editingCommentData.value) return
  const index = comments.value.findIndex(c => c.id === editingCommentId.value)
  if (index !== -1) {
    comments.value[index] = { ...editingCommentData.value }
  }
  cancelEditComment()
}

async function saveComments() {
  saving.value = true

  try {
    await $fetch('/api/admin/features/comments', {
      method: 'PUT',
      body: {
        comments: comments.value,
      },
    })
    await refresh()
    showSuccessToast('评论已保存')
  } catch (err) {
    showErrorToast('保存失败', getRequestErrorMessage(err, '保存失败'))
  } finally {
    saving.value = false
  }
}

const headerActions = computed(() => [
  {
    label: '新增示例',
    icon: 'lucide:plus',
    variant: 'secondary' as const,
    disabled: pending.value,
    onClick: addComment,
  },
  {
    label: '保存评论',
    disabled: saving.value || pending.value,
    onClick: saveComments,
  },
])

watch(error, (value) => {
  if (value) {
    showErrorToast('评论加载失败', value.message)
  }
}, { immediate: true })
</script>

<template>
  <div class="cms-page space-y-3">
    <AdminPageHeader title="评论管理" subtitle="" :actions="headerActions" />

    <section class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap gap-2">
        <UiButton
          v-for="value in ['all', 'pending', 'approved', 'spam'] as const"
          :key="value"
          size="sm"
          :variant="statusFilter === value ? 'default' : 'secondary'"
          @click="statusFilter = value"
        >
          {{ value === 'all' ? '全部' : value === 'pending' ? '待审核' : value === 'approved' ? '已通过' : '垃圾' }}
        </UiButton>
      </div>
      <p class="text-sm text-[var(--text-secondary)]">
        {{ filteredComments.length }} / {{ comments.length }} 条评论
      </p>
    </section>

    <div v-if="pending" class="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-card)] px-6 py-14 text-center text-sm text-[var(--text-secondary)]">
      正在加载评论...
    </div>

    <div v-else class="space-y-4">
      <div v-if="!filteredComments.length" class="rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-card)] px-6 py-14 text-center text-sm text-[var(--text-secondary)]">
        当前没有评论。
      </div>

      <div
        v-for="comment in filteredComments"
        :key="comment.id"
      >
        <!-- 编辑状态 (Quick Edit) -->
        <div v-if="editingCommentId === comment.id && editingCommentData" class="rounded-2xl border-2 border-[var(--primary)] bg-[var(--surface-card)] p-5 shadow-sm transition-all">
          <div class="mb-4 text-sm font-bold text-[var(--primary)]">编辑评论</div>
          <div class="grid gap-4 md:grid-cols-2">
            <label class="block space-y-1">
              <span class="text-xs font-medium text-[var(--text-secondary)]">作者</span>
              <UiInput v-model="editingCommentData.author" />
            </label>
            <label class="block space-y-1">
              <span class="text-xs font-medium text-[var(--text-secondary)]">邮箱</span>
              <UiInput v-model="editingCommentData.email" />
            </label>
            <label class="block space-y-1">
              <span class="text-xs font-medium text-[var(--text-secondary)]">文章 Slug</span>
              <UiInput v-model="editingCommentData.articleSlug" />
            </label>
            <label class="block space-y-1">
              <span class="text-xs font-medium text-[var(--text-secondary)]">状态</span>
              <select v-model="editingCommentData.status" class="h-10 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface-card)] px-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--focus-ring)]">
                <option value="pending">待审核</option>
                <option value="approved">已通过</option>
                <option value="spam">垃圾</option>
              </select>
            </label>
            <label class="block space-y-1 md:col-span-2">
              <span class="text-xs font-medium text-[var(--text-secondary)]">评论内容</span>
              <UiTextarea v-model="editingCommentData.content" class="min-h-24" />
            </label>
          </div>
          <div class="mt-4 flex justify-end gap-2">
            <UiButton variant="secondary" size="sm" @click="cancelEditComment">取消</UiButton>
            <UiButton size="sm" @click="saveEditComment">更新评论</UiButton>
          </div>
        </div>

        <!-- 只读状态 (Read Only with Hover Actions) -->
        <div v-else class="group relative overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-card)] p-5 transition-all hover:border-[var(--border-strong)] hover:shadow-sm">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div class="flex size-10 flex-shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-lg font-bold text-[var(--primary)]">
              {{ comment.author?.charAt(0).toUpperCase() || 'A' }}
            </div>
            
            <div class="flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-bold text-[var(--text-primary)]">{{ comment.author }}</span>
                <span class="text-sm text-[var(--text-secondary)]">
                  <a v-if="comment.email" :href="`mailto:${comment.email}`" class="hover:underline hover:text-[var(--primary)] transition-colors">{{ comment.email }}</a>
                </span>
                <UiBadge :variant="comment.status === 'approved' ? 'success' : comment.status === 'spam' ? 'destructive' : 'warning'" class="ml-auto">
                  {{ comment.status === 'approved' ? '已通过' : comment.status === 'spam' ? '垃圾' : '待审核' }}
                </UiBadge>
              </div>
              
              <div class="mt-1 text-xs text-[var(--text-muted)]">
                {{ new Date(comment.createdAt).toLocaleString() }} 
                于 <span class="font-medium text-[var(--text-primary)]">{{ comment.articleSlug || '未关联文章' }}</span>
              </div>

              <div class="mt-3 text-sm leading-relaxed text-[var(--text-primary)] whitespace-pre-wrap">
                {{ comment.content }}
              </div>

              <!-- 悬停操作浮层 -->
              <div class="mt-4 flex flex-wrap items-center gap-4 text-sm font-medium opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 sm:opacity-100 md:opacity-0">
                <button
                  v-if="comment.status !== 'approved'"
                  class="text-green-600 transition-colors hover:text-green-700 dark:text-green-500 dark:hover:text-green-400"
                  @click="updateCommentStatus(comment.id, 'approved')"
                >批准</button>
                <button
                  v-if="comment.status === 'approved'"
                  class="text-orange-500 transition-colors hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300"
                  @click="updateCommentStatus(comment.id, 'pending')"
                >驳回</button>
                <button class="text-blue-500 transition-colors hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300" @click="startEditComment(comment)">
                  快速编辑
                </button>
                <button
                  v-if="comment.status !== 'spam'"
                  class="text-amber-600 transition-colors hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400"
                  @click="updateCommentStatus(comment.id, 'spam')"
                >标为垃圾</button>
                <button class="text-red-500 transition-colors hover:text-red-600 dark:text-red-400 dark:hover:text-red-300" @click="removeComment(comment.id)">
                  永久删除
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
