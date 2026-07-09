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
}> = [
  {
    value: 'split-right',
    label: '右图左文',
    description: '左侧显示标题摘要，右侧显示封面图（默认）。',
  },
  {
    value: 'split-left',
    label: '左图右文',
    description: '左侧显示封面图，右侧显示标题摘要。',
  },
  {
    value: 'top-hero',
    label: '上半屏背景',
    description: '封面图铺满上半区域，标题摘要叠加在图上。',
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
      class="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/12 dark:text-amber-200"
    >
      {{ props.disabledMessage }}
    </div>

    <section class="overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--surface-card)] shadow-none">
      <div class="flex min-h-14 items-center gap-3 border-b border-[var(--border-strong)] bg-[var(--surface-card)] px-3">
        <UiInput
          v-model="form.title"
          :disabled="formDisabled"
          type="text"
          placeholder="输入文章标题..."
          class="h-auto min-w-0 flex-1 rounded-none border-0 bg-transparent px-0 py-0 text-base font-bold text-[var(--text-primary)] shadow-none outline-none placeholder:text-[var(--text-muted)] focus:border-transparent focus:ring-0"
        />

        <div class="flex shrink-0 items-center gap-1">
          <UiButton
            v-if="previewTarget"
            variant="ghost"
            size="icon"
            :as="'NuxtLink'"
            :to="previewTarget"
            target="_blank"
            rel="noreferrer"
            title="预览"
            aria-label="预览"
          >
            <Icon name="lucide:link" class="size-4" />
          </UiButton>
          <UiButton
            variant="ghost"
            size="icon"
            title="布局预览"
            aria-label="布局预览"
            @click="layoutPreviewOpen = true"
          >
            <Icon name="lucide:monitor-play" class="size-4" />
          </UiButton>
          <UiButton
            variant="ghost"
            size="icon"
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
            title="文章设置"
            aria-label="文章设置"
            @click="settingsOpen = !settingsOpen"
          >
            <Icon name="lucide:settings" class="size-4" />
          </UiButton>
          <UiButton :disabled="formDisabled" variant="ghost" size="sm" @click="handleSubmit()">
            {{ props.submitLabel || '保存文章' }}
          </UiButton>
          <UiButton
            v-if="props.article"
            variant="ghost"
            size="icon"
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
        :class="settingsOpen ? 'xl:grid-cols-[minmax(0,1fr)_22rem]' : 'xl:grid-cols-[minmax(0,1fr)_0rem]'"
      >
        <div class="min-w-0">
          <div class="h-[min(620px,calc(100dvh-10rem))] min-h-[420px] bg-white dark:bg-[var(--card)]">
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
          <div class="h-[min(620px,calc(100dvh-10rem))] min-h-[420px] overflow-y-auto p-4">
            <div class="space-y-4">
              <section class="rounded-lg border border-[var(--border-soft)] bg-[var(--surface-card)]">
                <div class="border-b border-[var(--border-soft)] px-4 py-3">
                  <p class="text-sm font-semibold text-[var(--text-primary)]">
                    文章设置
                  </p>
                </div>

                <div class="space-y-5 p-4">
                  <UiLabel class="flex items-start gap-3">
                    <UiCheckbox v-model="form.published" :disabled="formDisabled" />
                    <span>
                      <span class="block text-sm font-semibold text-[var(--text-primary)]">
                        发布到前台
                      </span>
                    </span>
                  </UiLabel>

                  <UiLabel class="flex items-start gap-3">
                    <UiCheckbox v-model="form.pinned" :disabled="formDisabled" />
                    <span>
                      <span class="block text-sm font-semibold text-[var(--text-primary)]">
                        置顶文章
                      </span>
                    </span>
                  </UiLabel>

                  <UiLabel class="block space-y-2">
                    <span class="text-xs font-medium text-[var(--text-secondary)]">分类</span>
                    <UiSelect v-model="selectedCategoryId" :disabled="formDisabled || categoriesPending">
                      <UiSelectTrigger>
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
                      class="min-h-[118px]"
                    />
                  </UiLabel>

                  <UiLabel class="block space-y-2">
                    <span class="text-xs font-medium text-[var(--text-secondary)]">封面图 URL</span>
                    <UiInput
                      v-model="form.coverImage"
                      :disabled="formDisabled"
                      placeholder="https://example.com/cover.jpg"
                    />
                  </UiLabel>

                  <div
                    v-if="form.coverImage"
                    class="overflow-hidden rounded-md border border-[var(--border-soft)] bg-[var(--surface-low)]"
                  >
                    <img :src="form.coverImage" alt="cover preview" class="aspect-[16/9] w-full object-cover">
                  </div>

                  <div class="space-y-2">
                    <span class="text-xs font-medium text-[var(--text-secondary)]">图文布局</span>
                    <div class="space-y-2">
                      <UiButton
                        v-for="option in coverLayoutOptions"
                        :key="option.value"
                        type="button"
                        :disabled="formDisabled"
                        variant="outline"
                        class="h-auto w-full flex-col items-start justify-start gap-0 whitespace-normal p-3 text-left"
                        :class="form.coverLayout === option.value
                          ? 'border-[var(--primary)] bg-[var(--primary-soft)]'
                          : 'border-[var(--border-soft)] hover:border-[var(--primary)]/45'"
                        @click="form.coverLayout = option.value"
                      >
                        <p class="text-sm font-semibold text-[var(--text-primary)]">
                          {{ option.label }}
                        </p>
                        <p class="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
                          {{ option.description }}
                        </p>
                      </UiButton>
                    </div>
                  </div>
                </div>
              </section>

              <section class="rounded-lg border border-[var(--border-soft)] bg-[var(--surface-card)] p-4">
                <p class="text-sm font-semibold text-[var(--text-primary)]">
                  写作统计
                </p>
                <div class="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div class="rounded-md bg-[var(--surface-low)] px-2 py-3">
                    <p class="text-lg font-bold text-[var(--text-primary)]">
                      {{ articleStats.words }}
                    </p>
                    <p class="mt-1 text-[10px] font-semibold text-[var(--text-secondary)]">
                      词数
                    </p>
                  </div>
                  <div class="rounded-md bg-[var(--surface-low)] px-2 py-3">
                    <p class="text-lg font-bold text-[var(--text-primary)]">
                      {{ articleStats.paragraphs }}
                    </p>
                    <p class="mt-1 text-[10px] font-semibold text-[var(--text-secondary)]">
                      段落
                    </p>
                  </div>
                  <div class="rounded-md bg-[var(--surface-low)] px-2 py-3">
                    <p class="text-lg font-bold text-[var(--text-primary)]">
                      {{ articleStats.chars }}
                    </p>
                    <p class="mt-1 text-[10px] font-semibold text-[var(--text-secondary)]">
                      字符
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </aside>
      </div>

      <div class="flex min-h-9 items-center justify-between gap-3 border-t border-[var(--border-soft)] bg-[var(--surface-card)] px-3 text-xs text-[var(--text-secondary)]">
        <span>TinyMCE</span>
        <span>{{ articleStats.paragraphs }} 段 / {{ articleStats.chars }} 字符</span>
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
        <div class="flex h-full flex-col overflow-hidden rounded-lg border border-[var(--border-soft)] bg-[var(--bg-primary)] shadow-none">
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
