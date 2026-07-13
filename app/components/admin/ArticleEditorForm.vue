<script setup lang="ts">
import {
  DEFAULT_ARTICLE_COVER_LAYOUT,
  type ArticleCoverLayout,
  type ManagedArticle,
  type ManagedArticlePayload,
} from '~~/shared/types/articles'
import { normalizeArticleSlug } from '~~/shared/utils/articleSlug'
import PostArticleDetail from '@/components/posts/PostArticleDetail.vue'
import TinyMceEditor from '@/components/admin/TinyMceEditor.client.vue'

interface CategoryItem {
  id: string
  name: string
  parentId: string
  order: number
}

const props = defineProps<{
  article?: ManagedArticle | null
  disabled?: boolean
  disabledMessage?: string
  loading?: boolean
  submitLabel?: string
}>()

interface ArticleEditorSubmitOptions {
  shortcut?: boolean
}

const emit = defineEmits<{
  submit: [payload: ManagedArticlePayload, options?: ArticleEditorSubmitOptions]
  delete: []
}>()

const defaultContent = [
  '<h2>从这里开始写正文</h2>',
  '<p>你可以直接使用富文本编辑器组织内容，例如段落、列表、引用、图片和链接。</p>',
  '<ul><li>列表项 A</li><li>列表项 B</li></ul>',
  '<blockquote>这是一段引用</blockquote>',
].join('')
const contentPlaceholder = '从这里开始写正文。你可以使用段落、列表、引用、图片和链接组织内容。'
const coverLayoutOptions: Array<{
  value: ArticleCoverLayout
  label: string
  icon: string
}> = [
  {
    value: 'split-right',
    label: '右图左文',
    icon: 'lucide:panel-right',
  },
  {
    value: 'split-left',
    label: '左图右文',
    icon: 'lucide:panel-left',
  },
  {
    value: 'top-hero',
    label: '上半屏背景',
    icon: 'lucide:panel-top',
  },
]
const CATEGORY_NONE_VALUE = '__none__'

const form = reactive<ManagedArticlePayload>({
  title: '',
  slug: '',
  summary: '',
  categoryId: '',
  coverImage: '',
  coverLayout: DEFAULT_ARTICLE_COVER_LAYOUT,
  published: false,
  pinned: false,
  content: defaultContent,
})

const formDisabled = computed(() => Boolean(props.loading || props.disabled))
const settingsOpen = ref(true)
const layoutPreviewOpen = ref(false)
const deleteDialogOpen = ref(false)
const editorRef = ref<{ focus: () => void } | null>(null)
const formErrors = reactive({
  title: '',
  content: '',
})
const { data: categoryData, pending: categoriesPending } = useFetch<{ categories: CategoryItem[] }>('/api/admin/features/categories', {
  default: () => ({ categories: [] }),
})
const categoryOptions = computed(() => {
  const categories = [...(categoryData.value?.categories || [])]
  const map = new Map<string, CategoryItem[]>()

  categories.forEach((category) => {
    const parentId = category.parentId || ''

    if (!map.has(parentId)) {
      map.set(parentId, [])
    }

    map.get(parentId)!.push(category)
  })

  map.forEach(group => group.sort((left, right) => left.order - right.order))

  const result: Array<CategoryItem & { depth: number }> = []
  const walk = (parentId: string, depth: number) => {
    for (const category of map.get(parentId) || []) {
      result.push({ ...category, depth })
      walk(category.id, depth + 1)
    }
  }

  walk('', 0)
  return result
})

const selectedCategoryId = computed({
  get() {
    return form.categoryId || CATEGORY_NONE_VALUE
  },
  set(value: string) {
    form.categoryId = value === CATEGORY_NONE_VALUE ? '' : value
  },
})

const previewTarget = computed(() => {
  if (!props.article?.slug) {
    return null
  }

  return props.article.published
    ? { name: 'detail-slug', params: { slug: props.article.slug } }
    : { name: 'detail-slug', params: { slug: props.article.slug }, query: { preview: '1' } }
})

const articleStats = computed(() => {
  const plainText = form.content
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .trim()
  const words = plainText ? plainText.split(/\s+/).length : 0
  const paragraphs = form.content
    ? Math.max(1, (form.content.match(/<(p|h[1-6]|li|blockquote)\b/gi) || []).length)
    : 0

  return {
    words,
    paragraphs,
    chars: form.content.length,
  }
})
const estimatedReadMinutes = computed(() => Math.max(1, Math.ceil(articleStats.value.chars / 500)))

const previewArticle = computed<ManagedArticle>(() => {
  const payload = buildPayload()
  const now = new Date().toISOString()
  const slug = payload.slug || 'preview'
  const title = payload.title || '未命名文章'
  const summary = payload.summary || '这里会显示文章摘要。'

  return {
    id: props.article?.id || 'preview',
    slug,
    title,
    summary,
    categoryId: payload.categoryId,
    description: summary,
    coverImage: payload.coverImage || '/cover.jpg',
    coverLayout: payload.coverLayout,
    viewCount: props.article?.viewCount || 0,
    published: payload.published,
    pinned: payload.pinned,
    content: payload.content || defaultContent,
    createdAt: props.article?.createdAt || now,
    updatedAt: props.article?.updatedAt || now,
    path: `/detail/${slug}`,
  }
})

function createPreviewHash(value: string) {
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(31, hash) + value.charCodeAt(index) | 0
  }

  return hash.toString(36)
}

const previewRenderKey = computed(() => [
  previewArticle.value.id,
  previewArticle.value.slug,
  previewArticle.value.title,
  previewArticle.value.summary,
  previewArticle.value.coverLayout,
  previewArticle.value.coverImage,
  previewArticle.value.content.length,
  createPreviewHash(previewArticle.value.content),
].join('|'))

watch(
  () => props.article,
  (article) => {
    form.title = article?.title || ''
    form.slug = article?.slug || ''
    form.summary = article?.summary || ''
    form.categoryId = article?.categoryId || ''
    form.coverImage = article?.coverImage || ''
    form.coverLayout = article?.coverLayout || DEFAULT_ARTICLE_COVER_LAYOUT
    form.published = article?.published ?? false
    form.pinned = article?.pinned ?? false
    form.content = article?.content || defaultContent
  },
  { immediate: true },
)

watch(() => form.title, (value) => {
  if (value.trim()) {
    formErrors.title = ''
  }

  if (!props.article?.slug) {
    form.slug = normalizeArticleSlug(value)
  }
})

watch(() => form.content, (value) => {
  if (value.trim()) {
    formErrors.content = ''
  }
})

function buildPayload(): ManagedArticlePayload {
  return {
    title: form.title.trim(),
    slug: normalizeArticleSlug(form.slug || form.title),
    summary: form.summary.trim(),
    categoryId: form.categoryId.trim(),
    coverImage: form.coverImage.trim(),
    coverLayout: form.coverLayout,
    published: form.published,
    pinned: form.pinned,
    content: form.content,
  }
}

async function validateForm() {
  formErrors.title = form.title.trim() ? '' : '请输入文章标题。'
  formErrors.content = form.content.trim() ? '' : '请输入文章正文。'

  if (formErrors.title) {
    await nextTick()
    document.getElementById('article-editor-title')?.focus()
    return false
  }

  if (formErrors.content) {
    await nextTick()
    editorRef.value?.focus()
    return false
  }

  return true
}

async function handleSubmit(options?: ArticleEditorSubmitOptions) {
  if (formDisabled.value) {
    return
  }

  if (!await validateForm()) {
    return
  }

  emit('submit', buildPayload(), options)
}

function handleDeleteDialogOpenChange(open: boolean) {
  if (!open && formDisabled.value) {
    return
  }

  deleteDialogOpen.value = open
}

function isSaveShortcut(event: KeyboardEvent) {
  return (event.metaKey || event.ctrlKey)
    && !event.altKey
    && !event.shiftKey
    && event.key.toLowerCase() === 's'
}

function handleSaveShortcut(event?: KeyboardEvent) {
  event?.preventDefault()
  event?.stopPropagation()
  void handleSubmit({ shortcut: true })
}

function handleDocumentKeydown(event: KeyboardEvent) {
  if (isSaveShortcut(event)) {
    handleSaveShortcut(event)
  }
}

onMounted(() => {
  if (import.meta.client) {
    window.addEventListener('keydown', handleDocumentKeydown)
  }
})

onBeforeUnmount(() => {
  if (import.meta.client) {
    window.removeEventListener('keydown', handleDocumentKeydown)
  }
})

defineExpose({
  getPayload: buildPayload,
})
</script>

<template>
  <div class="admin-article-workbench">
    <UiAlert v-if="props.disabledMessage" variant="warning" class="mb-4">
      <Icon name="lucide:database-zap" class="size-4" />
      <UiAlertTitle>数据库未配置</UiAlertTitle>
      <UiAlertDescription>{{ props.disabledMessage }}</UiAlertDescription>
    </UiAlert>

    <section class="overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--surface-card)]">
      <div class="flex min-h-16 flex-col gap-3 border-b border-[var(--border-strong)] bg-[var(--surface-card)] px-3 py-2.5 md:flex-row md:items-center">
        <div class="flex min-w-0 flex-1 items-start gap-3">
          <span class="mt-6 grid size-8 shrink-0 place-items-center rounded-md bg-[var(--surface-high)] text-[var(--text-secondary)]">
            <Icon name="lucide:file-pen-line" class="size-4" />
          </span>
          <div class="min-w-0 flex-1 space-y-2">
            <UiLabel for="article-editor-title" class="text-xs font-medium text-[var(--text-secondary)]">
              文章标题 <span class="text-[var(--danger)]">*</span>
            </UiLabel>
            <UiInput
              id="article-editor-title"
              v-model="form.title"
              :disabled="formDisabled"
              type="text"
              placeholder="输入文章标题"
              class="min-w-0 max-w-none"
              required
              :aria-invalid="Boolean(formErrors.title)"
              :aria-describedby="formErrors.title ? 'article-editor-title-error' : undefined"
            />
            <p v-if="formErrors.title" id="article-editor-title-error" class="text-xs text-[var(--danger)]" role="alert">
              {{ formErrors.title }}
            </p>
          </div>
          <UiBadge :variant="form.published ? 'success' : 'warning'" class="mt-6 hidden shrink-0 gap-1.5 whitespace-nowrap normal-case tracking-[0] sm:inline-flex">
            <span class="size-1.5 rounded-full bg-current" />
            {{ form.published ? '已发布' : '草稿' }}
          </UiBadge>
        </div>

        <div class="flex min-w-0 items-center justify-end gap-1">
          <UiButton :disabled="formDisabled" size="sm" class="shrink-0" @click="handleSubmit()">
            <Icon :name="props.loading ? 'lucide:loader-circle' : 'lucide:save'" :class="['size-4', props.loading ? 'animate-spin' : '']" />
            {{ props.submitLabel || '保存文章' }}
          </UiButton>

          <UiTooltip>
            <UiTooltipTrigger as-child>
              <UiButton
                variant="ghost"
                size="icon-sm"
                class="hidden md:inline-flex"
                aria-label="文章设置"
                :aria-pressed="settingsOpen"
                @click="settingsOpen = !settingsOpen"
              >
                <Icon name="lucide:settings" class="size-4" />
              </UiButton>
            </UiTooltipTrigger>
            <UiTooltipContent>{{ settingsOpen ? '收起文章设置' : '展开文章设置' }}</UiTooltipContent>
          </UiTooltip>

          <UiDropdownMenu>
            <UiTooltip>
              <UiTooltipTrigger as-child>
                <UiDropdownMenuTrigger as-child>
                  <UiButton variant="ghost" size="icon-sm" aria-label="更多文章操作">
                    <Icon name="lucide:ellipsis" class="size-4" />
                  </UiButton>
                </UiDropdownMenuTrigger>
              </UiTooltipTrigger>
              <UiTooltipContent>更多操作</UiTooltipContent>
            </UiTooltip>
            <UiDropdownMenuContent align="end">
              <UiDropdownMenuItem v-if="previewTarget" as-child>
                <NuxtLink :to="previewTarget" target="_blank" rel="noreferrer">
                  <Icon name="lucide:external-link" />
                  查看前台
                </NuxtLink>
              </UiDropdownMenuItem>
              <UiDropdownMenuItem @select="layoutPreviewOpen = true">
                <Icon name="lucide:monitor-play" />
                布局预览
              </UiDropdownMenuItem>
              <UiDropdownMenuItem class="md:hidden" @select="settingsOpen = !settingsOpen">
                <Icon name="lucide:settings" />
                {{ settingsOpen ? '收起文章设置' : '展开文章设置' }}
              </UiDropdownMenuItem>
              <UiDropdownMenuItem :disabled="formDisabled" @select="form.pinned = !form.pinned">
                <Icon name="lucide:pin" />
                {{ form.pinned ? '取消置顶' : '置顶文章' }}
              </UiDropdownMenuItem>
              <template v-if="props.article">
                <UiDropdownMenuSeparator />
                <UiDropdownMenuItem variant="destructive" :disabled="formDisabled" @select="deleteDialogOpen = true">
                  <Icon name="lucide:trash-2" />
                  删除文章
                </UiDropdownMenuItem>
              </template>
            </UiDropdownMenuContent>
          </UiDropdownMenu>
        </div>
      </div>

      <div
        class="grid bg-[var(--card)] transition-[grid-template-columns] duration-200"
        :class="settingsOpen ? 'xl:grid-cols-[minmax(0,1fr)_23rem]' : 'xl:grid-cols-[minmax(0,1fr)_0rem]'"
      >
        <div class="min-w-0">
          <div class="flex h-[calc(100dvh-10rem)] min-h-[34rem] max-h-[52rem] flex-col bg-[var(--card)]">
            <div class="shrink-0 space-y-1 border-b border-[var(--border-soft)] px-4 py-2">
              <UiLabel class="text-xs font-medium text-[var(--text-secondary)]">
                文章正文 <span class="text-[var(--danger)]">*</span>
              </UiLabel>
              <p v-if="formErrors.content" class="text-xs text-[var(--danger)]" role="alert">
                {{ formErrors.content }}
              </p>
            </div>
            <TinyMceEditor
              ref="editorRef"
              v-model="form.content"
              :disabled="formDisabled"
              height="100%"
              :placeholder="contentPlaceholder"
              class="min-h-0 flex-1"
              @save-shortcut="handleSaveShortcut"
            />
          </div>
        </div>

        <aside
          class="min-w-0 overflow-hidden border-t border-[var(--border-soft)] bg-[var(--surface-low)] xl:border-l xl:border-t-0"
          :class="settingsOpen ? 'block' : 'hidden xl:block xl:w-0 xl:border-l-0'"
        >
          <div class="h-[calc(100dvh-10rem)] min-h-[34rem] max-h-[52rem] overflow-y-auto">
            <div class="sticky top-0 z-10 flex min-h-12 items-center justify-between border-b border-[var(--border-soft)] bg-[var(--surface-low)] px-4">
              <div class="flex items-center gap-2">
                <Icon name="lucide:settings-2" class="size-4 text-[var(--text-secondary)]" />
                <p class="text-sm font-semibold text-[var(--text-primary)]">文章设置</p>
              </div>
              <UiTooltip>
                <UiTooltipTrigger as-child>
                  <UiButton variant="ghost" size="icon-sm" class="xl:hidden" aria-label="关闭设置" @click="settingsOpen = false">
                    <Icon name="lucide:x" class="size-4" />
                  </UiButton>
                </UiTooltipTrigger>
                <UiTooltipContent>关闭设置</UiTooltipContent>
              </UiTooltip>
            </div>

            <section class="divide-y divide-[var(--border-soft)] border-b border-[var(--border-soft)] bg-[var(--surface-card)] px-4">
              <label class="flex cursor-pointer items-center justify-between gap-4 py-3.5">
                <span class="flex items-center gap-3">
                  <span class="grid size-8 place-items-center rounded-md bg-[var(--success-soft)] text-[var(--success)]">
                    <Icon name="lucide:send" class="size-4" />
                  </span>
                  <span>
                    <span class="block text-sm font-medium text-[var(--text-primary)]">发布到前台</span>
                    <span class="mt-0.5 block text-xs text-[var(--text-secondary)]">{{ form.published ? '已发布' : '保存为草稿' }}</span>
                  </span>
                </span>
                <UiCheckbox v-model="form.published" :disabled="formDisabled" />
              </label>

              <label class="flex cursor-pointer items-center justify-between gap-4 py-3.5">
                <span class="flex items-center gap-3">
                  <span class="grid size-8 place-items-center rounded-md bg-[var(--info-soft)] text-[var(--info)]">
                    <Icon name="lucide:pin" class="size-4" />
                  </span>
                  <span>
                    <span class="block text-sm font-medium text-[var(--text-primary)]">置顶文章</span>
                    <span class="mt-0.5 block text-xs text-[var(--text-secondary)]">{{ form.pinned ? '列表优先展示' : '按更新时间排序' }}</span>
                  </span>
                </span>
                <UiCheckbox v-model="form.pinned" :disabled="formDisabled" />
              </label>
            </section>

            <section class="space-y-4 border-b border-[var(--border-soft)] p-4">
              <div class="flex items-center gap-2">
                <Icon name="lucide:align-left" class="size-4 text-[var(--text-secondary)]" />
                <h3 class="text-xs font-semibold text-[var(--text-primary)]">基础信息</h3>
              </div>

              <UiLabel class="block space-y-2">
                <span class="text-xs font-medium text-[var(--text-secondary)]">URL Slug</span>
                <UiInput
                  v-model="form.slug"
                  :disabled="formDisabled"
                  placeholder="article-slug"
                  class="max-w-none"
                />
              </UiLabel>

              <UiLabel class="block space-y-2">
                <span class="text-xs font-medium text-[var(--text-secondary)]">分类</span>
                <UiSelect v-model="selectedCategoryId" :disabled="formDisabled || categoriesPending">
                  <UiSelectTrigger class="max-w-none">
                    <UiSelectValue :placeholder="categoriesPending ? '正在加载分类...' : '选择分类'" />
                  </UiSelectTrigger>
                  <UiSelectContent>
                    <UiSelectItem :value="CATEGORY_NONE_VALUE">
                      {{ categoriesPending ? '正在加载分类...' : '未分类' }}
                    </UiSelectItem>
                    <UiSelectItem
                      v-for="category in categoryOptions"
                      :key="category.id"
                      :value="category.id"
                    >
                      {{ `${'— '.repeat(category.depth)}${category.name}` }}
                    </UiSelectItem>
                  </UiSelectContent>
                </UiSelect>
              </UiLabel>

              <UiLabel class="block space-y-2">
                <span class="text-xs font-medium text-[var(--text-secondary)]">摘要</span>
                <UiTextarea
                  v-model="form.summary"
                  :disabled="formDisabled"
                  placeholder="用于文章列表和 SEO 的简短摘要"
                />
              </UiLabel>
            </section>

            <section class="space-y-4 border-b border-[var(--border-soft)] p-4">
              <div class="flex items-center gap-2">
                <Icon name="lucide:image" class="size-4 text-[var(--text-secondary)]" />
                <h3 class="text-xs font-semibold text-[var(--text-primary)]">封面</h3>
              </div>

              <UiLabel class="block space-y-2">
                <span class="text-xs font-medium text-[var(--text-secondary)]">封面图 URL</span>
                <UiInput
                  v-model="form.coverImage"
                  :disabled="formDisabled"
                  placeholder="https://example.com/cover.jpg"
                  class="max-w-none"
                />
              </UiLabel>

              <div class="aspect-[16/8] overflow-hidden rounded-md border border-[var(--border-soft)] bg-[var(--surface-card)]">
                <img v-if="form.coverImage" :src="form.coverImage" alt="封面预览" class="size-full object-cover">
                <div v-else class="grid size-full place-items-center text-[var(--text-muted)]">
                  <Icon name="lucide:image-off" class="size-5" />
                </div>
              </div>

              <div class="space-y-2">
                <p class="text-xs font-medium text-[var(--text-secondary)]">图文布局</p>
                <UiButtonGroup orientation="vertical" class="w-full">
                  <UiButton
                    v-for="option in coverLayoutOptions"
                    :key="option.value"
                    type="button"
                    size="lg"
                    :variant="form.coverLayout === option.value ? 'secondary' : 'outline'"
                    :disabled="formDisabled"
                    class="w-full justify-start"
                    :aria-pressed="form.coverLayout === option.value"
                    @click="form.coverLayout = option.value"
                  >
                    <Icon :name="option.icon" class="size-4" />
                    {{ option.label }}
                    <Icon v-if="form.coverLayout === option.value" name="lucide:check" class="ml-auto size-4 shrink-0 text-[var(--primary)]" />
                  </UiButton>
                </UiButtonGroup>
              </div>
            </section>

            <section class="p-4">
              <div class="flex items-center gap-2">
                <Icon name="lucide:chart-no-axes-column" class="size-4 text-[var(--text-secondary)]" />
                <h3 class="text-xs font-semibold text-[var(--text-primary)]">写作统计</h3>
              </div>
              <div class="mt-3 grid grid-cols-4 overflow-hidden rounded-md border border-[var(--border-soft)] bg-[var(--surface-card)] text-center">
                <div class="px-2 py-3">
                  <p class="text-base font-bold tabular-nums text-[var(--text-primary)]">{{ articleStats.words }}</p>
                  <p class="mt-1 text-[10px] text-[var(--text-secondary)]">词数</p>
                </div>
                <div class="border-l border-[var(--border-soft)] px-2 py-3">
                  <p class="text-base font-bold tabular-nums text-[var(--text-primary)]">{{ articleStats.paragraphs }}</p>
                  <p class="mt-1 text-[10px] text-[var(--text-secondary)]">段落</p>
                </div>
                <div class="border-l border-[var(--border-soft)] px-2 py-3">
                  <p class="text-base font-bold tabular-nums text-[var(--text-primary)]">{{ articleStats.chars }}</p>
                  <p class="mt-1 text-[10px] text-[var(--text-secondary)]">字符</p>
                </div>
                <div class="border-l border-[var(--border-soft)] px-2 py-3">
                  <p class="text-base font-bold tabular-nums text-[var(--text-primary)]">{{ estimatedReadMinutes }}</p>
                  <p class="mt-1 text-[10px] text-[var(--text-secondary)]">分钟</p>
                </div>
              </div>
            </section>
          </div>
        </aside>
      </div>

      <div class="flex min-h-9 flex-wrap items-center justify-between gap-2 border-t border-[var(--border-soft)] bg-[var(--surface-card)] px-3 text-xs text-[var(--text-secondary)]">
        <span class="flex items-center gap-2">
          <span :class="['size-1.5 rounded-full', form.published ? 'bg-[var(--success)]' : 'bg-[var(--warning)]']" />
          {{ form.published ? '已发布' : '草稿' }}
        </span>
        <span class="font-mono">TinyMCE · {{ articleStats.paragraphs }} 段 · {{ articleStats.chars }} 字符 · 约 {{ estimatedReadMinutes }} 分钟</span>
      </div>
    </section>

    <UiDialog v-model:open="layoutPreviewOpen">
      <UiDialogContent size="xl" :show-close-button="false" class="h-[calc(100dvh-2rem)] gap-0 p-0">
        <div class="grid min-h-0 grid-rows-[auto_minmax(0,1fr)]">
          <div class="flex min-h-14 items-center justify-between gap-3 border-b border-[var(--border-soft)] px-4">
            <UiDialogHeader class="min-w-0">
              <UiDialogTitle>布局预览</UiDialogTitle>
              <UiDialogDescription class="truncate">
                {{ previewArticle.title }} / {{ previewArticle.coverLayout }}
              </UiDialogDescription>
            </UiDialogHeader>
            <UiTooltip>
              <UiTooltipTrigger as-child>
                <UiDialogClose as-child>
                  <UiButton variant="ghost" size="icon-sm" aria-label="关闭预览">
                    <Icon name="lucide:x" class="size-4" />
                  </UiButton>
                </UiDialogClose>
              </UiTooltipTrigger>
              <UiTooltipContent>关闭预览</UiTooltipContent>
            </UiTooltip>
          </div>

          <div class="min-h-0 overflow-auto py-6">
            <PostArticleDetail :key="previewRenderKey" :article="previewArticle" />
          </div>
        </div>
      </UiDialogContent>
    </UiDialog>

    <UiAlertDialog :open="deleteDialogOpen" @update:open="handleDeleteDialogOpenChange">
      <UiAlertDialogContent>
        <UiAlertDialogHeader>
          <UiAlertDialogTitle>删除文章？</UiAlertDialogTitle>
          <UiAlertDialogDescription>
            将永久删除“{{ form.title || '未命名文章' }}”，此操作无法撤销。
          </UiAlertDialogDescription>
        </UiAlertDialogHeader>
        <UiAlertDialogFooter>
          <UiAlertDialogCancel :disabled="formDisabled">取消</UiAlertDialogCancel>
          <UiAlertDialogAction class="min-w-24" variant="destructive" :disabled="formDisabled" @click.prevent="emit('delete')">
            <Icon v-if="props.loading" name="lucide:loader-circle" class="size-4 animate-spin" />
            {{ props.loading ? '删除中...' : '删除文章' }}
          </UiAlertDialogAction>
        </UiAlertDialogFooter>
      </UiAlertDialogContent>
    </UiAlertDialog>
  </div>
</template>
