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
const coverLayoutOptions: Array<{
  value: ArticleCoverLayout
  label: string
  description: string
  icon: string
}> = [
  {
    value: 'split-right',
    label: '右图左文',
    description: '左侧显示标题摘要，右侧显示封面图（默认）。',
    icon: 'lucide:panel-right',
  },
  {
    value: 'split-left',
    label: '左图右文',
    description: '左侧显示封面图，右侧显示标题摘要。',
    icon: 'lucide:panel-left',
  },
  {
    value: 'top-hero',
    label: '上半屏背景',
    description: '封面图铺满上半区域，标题摘要叠加在图上。',
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
  if (!props.article?.slug) {
    form.slug = normalizeArticleSlug(value)
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

function handleSubmit(options?: ArticleEditorSubmitOptions) {
  if (formDisabled.value) {
    return
  }

  emit('submit', buildPayload(), options)
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
  handleSubmit({ shortcut: true })
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
    <div
      v-if="props.disabledMessage"
      class="mb-4 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200"
    >
      <Icon name="lucide:database-zap" class="mt-0.5 size-4 shrink-0" />
      <span>{{ props.disabledMessage }}</span>
    </div>

    <section class="overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--surface-card)]">
      <div class="flex min-h-16 flex-col gap-3 border-b border-[var(--border-strong)] bg-[var(--surface-card)] px-3 py-2.5 md:flex-row md:items-center">
        <div class="flex min-w-0 flex-1 items-center gap-3">
          <span class="grid size-8 shrink-0 place-items-center rounded-md bg-[var(--surface-high)] text-[var(--text-secondary)]">
            <Icon name="lucide:file-pen-line" class="size-4" />
          </span>
          <UiInput
            v-model="form.title"
            :disabled="formDisabled"
            type="text"
            placeholder="输入文章标题"
            class="h-10 min-w-0 flex-1 rounded-md border-transparent bg-transparent px-2 text-base font-bold text-[var(--text-primary)] shadow-none placeholder:text-[var(--text-muted)] hover:bg-[var(--surface-low)] focus:bg-[var(--surface-low)] focus:ring-0"
          />
          <UiBadge
            variant="outline"
            :class="[
              'hidden shrink-0 gap-1.5 whitespace-nowrap px-2 py-1 text-xs font-medium normal-case tracking-[0] sm:inline-flex',
              form.published
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300'
                : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300',
            ]"
          >
            <span class="size-1.5 rounded-full bg-current" />
            {{ form.published ? '已发布' : '草稿' }}
          </UiBadge>
        </div>

        <div class="flex min-w-0 items-center justify-end gap-1 overflow-x-auto">
          <NuxtLink v-if="previewTarget" :to="previewTarget" custom v-slot="{ href }">
            <UiButton
              variant="ghost"
              size="icon"
              as="a"
              :href="href"
              target="_blank"
              rel="noreferrer"
              class="size-9 shrink-0 text-[var(--text-secondary)]"
              title="预览"
              aria-label="预览"
            >
              <Icon name="lucide:external-link" class="size-4" />
            </UiButton>
          </NuxtLink>
          <UiButton
            variant="ghost"
            size="icon"
            class="size-9 shrink-0 text-[var(--text-secondary)]"
            title="布局预览"
            aria-label="布局预览"
            @click="layoutPreviewOpen = true"
          >
            <Icon name="lucide:monitor-play" class="size-4" />
          </UiButton>
          <UiButton
            variant="ghost"
            size="icon"
            class="size-9 shrink-0"
            title="置顶"
            aria-label="置顶"
            :disabled="formDisabled"
            :class="form.pinned ? 'bg-[var(--primary-soft)] text-[var(--primary)]' : ''"
            @click="form.pinned = !form.pinned"
          >
            <Icon name="lucide:pin" class="size-4" />
          </UiButton>
          <UiButton
            variant="ghost"
            size="icon"
            class="size-9 shrink-0 text-[var(--text-secondary)]"
            title="文章设置"
            aria-label="文章设置"
            :aria-pressed="settingsOpen"
            @click="settingsOpen = !settingsOpen"
          >
            <Icon name="lucide:settings" class="size-4" />
          </UiButton>
          <UiButton :disabled="formDisabled" size="sm" class="h-9 shrink-0 px-3" @click="handleSubmit()">
            <Icon :name="props.loading ? 'lucide:loader-circle' : 'lucide:save'" :class="['size-4', props.loading ? 'animate-spin' : '']" />
            {{ props.submitLabel || '保存文章' }}
          </UiButton>
          <UiButton
            v-if="props.article"
            variant="ghost"
            size="icon"
            class="size-9 shrink-0 text-[var(--text-muted)] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
            :disabled="formDisabled"
            title="删除"
            aria-label="删除"
            @click="emit('delete')"
          >
            <Icon name="lucide:trash-2" class="size-4" />
          </UiButton>
        </div>
      </div>

      <div
        class="grid bg-white transition-[grid-template-columns] duration-200 dark:bg-[var(--card)]"
        :class="settingsOpen ? 'xl:grid-cols-[minmax(0,1fr)_23rem]' : 'xl:grid-cols-[minmax(0,1fr)_0rem]'"
      >
        <div class="min-w-0">
          <div class="h-[calc(100dvh-10rem)] min-h-[34rem] max-h-[52rem] bg-white dark:bg-[var(--card)]">
            <TinyMceEditor
              v-model="form.content"
              :disabled="formDisabled"
              height="100%"
              class="h-full"
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
              <UiButton variant="ghost" size="icon" class="size-8 xl:hidden" title="关闭设置" aria-label="关闭设置" @click="settingsOpen = false">
                <Icon name="lucide:x" class="size-4" />
              </UiButton>
            </div>

            <section class="divide-y divide-[var(--border-soft)] border-b border-[var(--border-soft)] bg-[var(--surface-card)] px-4">
              <label class="flex cursor-pointer items-center justify-between gap-4 py-3.5">
                <span class="flex items-center gap-3">
                  <span class="grid size-8 place-items-center rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
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
                  <span class="grid size-8 place-items-center rounded-md bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300">
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

              <UiLabel class="block space-y-1.5">
                <span class="text-xs font-medium text-[var(--text-secondary)]">URL Slug</span>
                <div class="relative">
                  <Icon name="lucide:link-2" class="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
                  <UiInput
                    v-model="form.slug"
                    :disabled="formDisabled"
                    placeholder="article-slug"
                    class="h-9 rounded-md border-[var(--border-soft)] bg-[var(--surface-card)] pl-8 font-mono text-xs"
                  />
                </div>
              </UiLabel>

              <UiLabel class="block space-y-1.5">
                <span class="text-xs font-medium text-[var(--text-secondary)]">分类</span>
                <UiSelect v-model="selectedCategoryId" :disabled="formDisabled || categoriesPending">
                  <UiSelectTrigger class="h-9 rounded-md border-[var(--border-soft)] bg-[var(--surface-card)]">
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

              <UiLabel class="block space-y-1.5">
                <span class="text-xs font-medium text-[var(--text-secondary)]">摘要</span>
                <UiTextarea
                  v-model="form.summary"
                  :disabled="formDisabled"
                  placeholder="用于文章列表和 SEO 的简短摘要"
                  class="min-h-28 resize-y rounded-md border-[var(--border-soft)] bg-[var(--surface-card)] leading-6"
                />
              </UiLabel>
            </section>

            <section class="space-y-4 border-b border-[var(--border-soft)] p-4">
              <div class="flex items-center gap-2">
                <Icon name="lucide:image" class="size-4 text-[var(--text-secondary)]" />
                <h3 class="text-xs font-semibold text-[var(--text-primary)]">封面</h3>
              </div>

              <UiLabel class="block space-y-1.5">
                <span class="text-xs font-medium text-[var(--text-secondary)]">封面图 URL</span>
                <UiInput
                  v-model="form.coverImage"
                  :disabled="formDisabled"
                  placeholder="https://example.com/cover.jpg"
                  class="h-9 rounded-md border-[var(--border-soft)] bg-[var(--surface-card)] text-xs"
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
                <div class="grid gap-2">
                  <button
                    v-for="option in coverLayoutOptions"
                    :key="option.value"
                    type="button"
                    :disabled="formDisabled"
                    class="flex min-h-14 w-full items-center gap-3 rounded-md border px-3 py-2 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50"
                    :class="form.coverLayout === option.value
                      ? 'border-[var(--primary)] bg-[var(--primary-soft)]'
                      : 'border-[var(--border-soft)] bg-[var(--surface-card)] hover:border-[var(--border-strong)]'"
                    @click="form.coverLayout = option.value"
                  >
                    <span class="grid size-8 shrink-0 place-items-center rounded-md bg-[var(--surface-high)] text-[var(--text-secondary)]">
                      <Icon :name="option.icon" class="size-4" />
                    </span>
                    <span class="min-w-0">
                      <span class="block text-sm font-medium text-[var(--text-primary)]">{{ option.label }}</span>
                      <span class="mt-0.5 block truncate text-xs text-[var(--text-secondary)]">{{ option.description }}</span>
                    </span>
                    <Icon v-if="form.coverLayout === option.value" name="lucide:check" class="ml-auto size-4 shrink-0 text-[var(--primary)]" />
                  </button>
                </div>
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
          <span :class="['size-1.5 rounded-full', form.published ? 'bg-emerald-500' : 'bg-amber-500']" />
          {{ form.published ? '已发布' : '草稿' }}
        </span>
        <span class="font-mono">TinyMCE · {{ articleStats.paragraphs }} 段 · {{ articleStats.chars }} 字符 · 约 {{ estimatedReadMinutes }} 分钟</span>
      </div>
    </section>

    <Teleport to="body">
      <div
        v-if="layoutPreviewOpen"
        class="fixed inset-0 z-[120] bg-slate-950/60 p-3 backdrop-blur-sm md:p-6"
        role="dialog"
        aria-modal="true"
        aria-label="文章布局预览"
      >
        <div class="flex h-full flex-col overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-primary)]">
          <div class="flex min-h-14 items-center justify-between gap-3 border-b border-[var(--border-soft)] bg-[var(--surface-card)] px-4">
            <div class="min-w-0">
              <p class="text-sm font-semibold text-[var(--text-primary)]">
                布局预览
              </p>
              <p class="truncate text-xs text-[var(--text-secondary)]">
                {{ previewArticle.title }} / {{ previewArticle.coverLayout }}
              </p>
            </div>
            <UiButton variant="ghost" size="icon" aria-label="关闭预览" @click="layoutPreviewOpen = false">
              <Icon name="lucide:x" class="size-4" />
            </UiButton>
          </div>

          <div class="min-h-0 flex-1 overflow-auto py-6">
            <PostArticleDetail :key="previewRenderKey" :article="previewArticle" />
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
