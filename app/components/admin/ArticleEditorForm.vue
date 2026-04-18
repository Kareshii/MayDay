<script setup lang="ts">
import {
  DEFAULT_ARTICLE_COVER_LAYOUT,
  type ArticleCoverLayout,
  type ManagedArticle,
  type ManagedArticlePayload,
} from '~~/shared/types/articles'
import { normalizeArticleSlug } from '~~/shared/utils/articleSlug'

const props = defineProps<{
  article?: ManagedArticle | null
  disabled?: boolean
  disabledMessage?: string
  loading?: boolean
  submitLabel?: string
}>()

const emit = defineEmits<{
  submit: [payload: ManagedArticlePayload]
  delete: []
}>()

const defaultContent = [
  '# 从这里开始写正文',
  '',
  '你可以使用 Markdown 语法组织内容，例如：',
  '',
  '- 列表项 A',
  '- 列表项 B',
  '',
  '> 这是一段引用',
].join('\n')
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

const form = reactive<ManagedArticlePayload>({
  title: '',
  slug: '',
  summary: '',
  coverImage: '',
  coverLayout: DEFAULT_ARTICLE_COVER_LAYOUT,
  published: false,
  content: defaultContent,
})

const slugEdited = ref(false)
const formDisabled = computed(() => Boolean(props.loading || props.disabled))
const editorMode = ref<'write' | 'preview'>('write')

watch(
  () => props.article,
  (article) => {
    form.title = article?.title || ''
    form.slug = article?.slug || ''
    form.summary = article?.summary || ''
    form.coverImage = article?.coverImage || ''
    form.coverLayout = article?.coverLayout || DEFAULT_ARTICLE_COVER_LAYOUT
    form.published = article?.published ?? false
    form.content = article?.content || defaultContent
    slugEdited.value = Boolean(article?.slug)
  },
  { immediate: true },
)

watch(() => form.title, (value) => {
  if (!slugEdited.value) {
    form.slug = normalizeArticleSlug(value)
  }
})

watch(() => form.slug, (value) => {
  const normalized = normalizeArticleSlug(form.title)
  slugEdited.value = value !== '' && value !== normalized
})

function handleSubmit() {
  if (formDisabled.value) {
    return
  }

  emit('submit', {
    title: form.title.trim(),
    slug: normalizeArticleSlug(form.slug || form.title),
    summary: form.summary.trim(),
    coverImage: form.coverImage.trim(),
    coverLayout: form.coverLayout,
    published: form.published,
    content: form.content,
  })
}
</script>

<template>
  <div class="space-y-6">
    <div
      v-if="props.disabledMessage"
      class="rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/12 dark:text-amber-200"
    >
      {{ props.disabledMessage }}
    </div>

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <UiCard class="p-6 lg:p-8">
        <div class="space-y-5">
          <label class="block space-y-2">
            <span class="cms-kicker">标题</span>
            <UiInput
              v-model="form.title"
              :disabled="formDisabled"
              placeholder="输入文章标题..."
              class="h-14 text-lg font-semibold"
            />
          </label>

          <div class="grid gap-4 sm:grid-cols-2">
            <label class="block space-y-2">
              <span class="cms-kicker">标识</span>
              <UiInput
                v-model="form.slug"
                :disabled="formDisabled"
                placeholder="my-first-post"
              />
            </label>

            <label class="block space-y-2">
              <span class="cms-kicker">摘要</span>
              <UiTextarea
                v-model="form.summary"
                :disabled="formDisabled"
                placeholder="用于文章列表和 SEO 的简短摘要"
                class="min-h-[92px]"
              />
            </label>
          </div>
        </div>

        <div class="mt-8">
          <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="text-sm font-semibold text-[var(--text-primary)]">
                正文内容
              </p>
              <p class="mt-1 text-xs text-[var(--text-secondary)]">
                使用 Markdown 编写正文，支持预览
              </p>
            </div>
            <div class="flex items-center gap-2">
              <UiBadge variant="secondary">
                Markdown
              </UiBadge>
              <div class="inline-flex rounded-lg border border-[var(--border-soft)] bg-[var(--surface-low)] p-1 lg:hidden">
                <button
                  type="button"
                  class="rounded-md px-3 py-1 text-xs font-semibold transition"
                  :class="editorMode === 'write'
                    ? 'bg-[var(--surface-card)] text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'"
                  @click="editorMode = 'write'"
                >
                  编辑
                </button>
                <button
                  type="button"
                  class="rounded-md px-3 py-1 text-xs font-semibold transition"
                  :class="editorMode === 'preview'
                    ? 'bg-[var(--surface-card)] text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'"
                  @click="editorMode = 'preview'"
                >
                  预览
                </button>
              </div>
            </div>
          </div>

          <div class="space-y-3 lg:hidden">
            <div v-if="editorMode === 'write'" class="space-y-2">
              <UiTextarea
                v-model="form.content"
                :disabled="formDisabled"
                placeholder="# 输入文章内容（Markdown）"
                class="min-h-[440px] font-mono text-[0.95rem] leading-7"
              />
              <p class="text-xs text-[var(--text-secondary)]">
                支持标题、列表、引用、代码块、链接和图片等常见 Markdown 语法。
              </p>
            </div>

            <div
              v-else
              class="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--surface-card)]"
            >
              <div
                v-if="form.content.trim().length === 0"
                class="px-4 py-10 text-sm text-[var(--text-secondary)]"
              >
                预览区域为空，请先输入 Markdown 内容。
              </div>
              <div v-else class="p-5 md:p-8">
                <MDC :value="form.content" class="blog-content" />
              </div>
            </div>
          </div>

          <div class="hidden lg:grid lg:grid-cols-2 lg:items-start lg:gap-5">
            <div class="space-y-2">
              <UiTextarea
                v-model="form.content"
                :disabled="formDisabled"
                placeholder="# 输入文章内容（Markdown）"
                class="min-h-[680px] font-mono text-[0.95rem] leading-7"
              />
              <p class="text-xs text-[var(--text-secondary)]">
                支持标题、列表、引用、代码块、链接和图片等常见 Markdown 语法。
              </p>
            </div>

            <div class="overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--surface-card)] lg:min-h-[680px]">
              <div
                v-if="form.content.trim().length === 0"
                class="px-4 py-10 text-sm text-[var(--text-secondary)] lg:flex lg:h-full lg:items-center lg:justify-center lg:px-8"
              >
                预览区域为空，请先输入 Markdown 内容。
              </div>
              <div v-else class="p-5 md:p-8 lg:h-[680px] lg:overflow-auto">
                <MDC :value="form.content" class="blog-content" />
              </div>
            </div>
          </div>
        </div>
      </UiCard>

      <div class="space-y-4">
        <UiCard class="p-5">
          <p class="cms-kicker">
            状态
          </p>
          <label class="mt-4 flex items-start gap-3">
            <UiCheckbox v-model="form.published" :disabled="formDisabled" class="mt-0.5" />
            <span>
              <span class="block text-sm font-semibold text-[var(--text-primary)]">
                发布到前台
              </span>
              <span class="block text-xs leading-6 text-[var(--text-secondary)]">
                关闭后文章仅后台可见，可通过预览链接查看。
              </span>
            </span>
          </label>
        </UiCard>

        <UiCard class="p-5">
          <p class="cms-kicker">
            封面设置
          </p>
          <label class="mt-4 block space-y-2">
            <span class="text-xs font-medium text-[var(--text-secondary)]">
              封面图 URL
            </span>
            <UiInput
              v-model="form.coverImage"
              :disabled="formDisabled"
              placeholder="https://example.com/cover.jpg"
            />
          </label>

          <div class="mt-5 space-y-2">
            <span class="text-xs font-medium text-[var(--text-secondary)]">
              图文布局
            </span>

            <div class="space-y-2">
              <button
                v-for="option in coverLayoutOptions"
                :key="option.value"
                type="button"
                :disabled="formDisabled"
                class="w-full rounded-xl border p-3 text-left transition"
                :class="form.coverLayout === option.value
                  ? 'border-[var(--primary)] bg-[var(--surface-low)]'
                  : 'border-[var(--border-soft)] hover:border-[var(--primary)]/45'"
                @click="form.coverLayout = option.value"
              >
                <p class="text-sm font-semibold text-[var(--text-primary)]">
                  {{ option.label }}
                </p>
                <p class="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
                  {{ option.description }}
                </p>
              </button>
            </div>
          </div>

          <div
            v-if="form.coverImage"
            class="mt-4 overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--surface-low)]"
          >
            <img :src="form.coverImage" alt="cover preview" class="aspect-[21/9] w-full object-cover">
          </div>
        </UiCard>

        <UiCard class="p-5">
          <p class="cms-kicker">
            写作提示
          </p>
          <ul class="mt-3 space-y-2 text-xs leading-6 text-[var(--text-secondary)]">
            <li>保持 slug 稳定，避免发布后频繁修改链接。</li>
            <li>摘要建议 80-160 字，便于列表和 SEO 展示。</li>
            <li>封面图建议使用 21:9 或 16:9 横图。</li>
          </ul>
        </UiCard>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <UiButton :disabled="formDisabled" @click="handleSubmit">
        {{ props.submitLabel || '保存文章' }}
      </UiButton>

      <UiButton
        v-if="props.article"
        variant="outline"
        :as="'NuxtLink'"
        :to="props.article.published
          ? { name: 'detail-slug', params: { slug: props.article.slug } }
          : { name: 'detail-slug', params: { slug: props.article.slug }, query: { preview: '1' } }"
        target="_blank"
        rel="noreferrer"
      >
        预览
      </UiButton>

      <UiButton
        v-if="props.article"
        variant="destructive"
        :disabled="formDisabled"
        @click="emit('delete')"
      >
        删除
      </UiButton>
    </div>
  </div>
</template>
