<script setup lang="ts">
import TinyMceEditor from './TinyMceEditor.client.vue'
import type { ManagedArticle, ManagedArticlePayload } from '~~/shared/types/articles'
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

const defaultContent = '<p>从这里开始写正文。</p>'

const form = reactive<ManagedArticlePayload>({
  title: '',
  slug: '',
  summary: '',
  coverImage: '',
  published: false,
  content: defaultContent,
})

const slugEdited = ref(false)
const formDisabled = computed(() => Boolean(props.loading || props.disabled))

watch(
  () => props.article,
  (article) => {
    form.title = article?.title || ''
    form.slug = article?.slug || ''
    form.summary = article?.summary || ''
    form.coverImage = article?.coverImage || ''
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
    published: form.published,
    content: form.content,
  })
}
</script>

<template>
  <div class="space-y-6">
    <div
      v-if="props.disabledMessage"
      class="rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
    >
      {{ props.disabledMessage }}
    </div>

    <UiCard class="p-6">
      <div class="grid gap-5 md:grid-cols-2">
        <label class="block">
          <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
            标题
          </span>
          <UiInput v-model="form.title" :disabled="formDisabled" placeholder="输入文章标题" />
        </label>

        <label class="block">
          <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
            标识
          </span>
          <UiInput v-model="form.slug" :disabled="formDisabled" placeholder="my-first-post" />
        </label>
      </div>

      <div class="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <label class="block">
          <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
            摘要
          </span>
          <UiTextarea
            v-model="form.summary"
            :disabled="formDisabled"
            placeholder="用于文章列表和 SEO 的简短摘要"
            class="min-h-[140px]"
          />
        </label>

        <UiCard class="p-5">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
            状态
          </p>
          <label class="mt-4 flex items-start gap-3">
            <UiCheckbox v-model="form.published" :disabled="formDisabled" class="mt-0.5" />
            <span>
              <span class="block text-sm font-medium text-[var(--text-primary)]">
                已发布
              </span>
              <span class="block text-xs leading-6 text-[var(--text-secondary)]">
                草稿默认不会出现在 `/posts`，除非使用预览模式。
              </span>
            </span>
          </label>
        </UiCard>
      </div>

      <label class="mt-5 block">
        <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
          封面图 URL
        </span>
        <UiInput v-model="form.coverImage" :disabled="formDisabled" placeholder="https://example.com/cover.jpg" />
      </label>

      <div v-if="form.coverImage" class="mt-5 overflow-hidden rounded-3xl border border-[var(--border)] bg-slate-950">
        <img :src="form.coverImage" alt="cover preview" class="aspect-[21/9] w-full object-cover">
      </div>
    </UiCard>

    <UiCard class="p-6">
      <div class="mb-4 flex items-center justify-between">
        <div>
          <p class="text-sm font-semibold text-[var(--text-primary)]">
            正文内容
          </p>
          <p class="mt-1 text-xs text-[var(--text-secondary)]">
            TinyMCE WYSIWYG editor
          </p>
        </div>
        <UiBadge variant="secondary">
          HTML 输出
        </UiBadge>
      </div>

      <TinyMceEditor v-model="form.content" :disabled="formDisabled" />
    </UiCard>

    <div class="flex flex-wrap items-center gap-3">
      <UiButton :disabled="formDisabled" @click="handleSubmit">
        {{ props.submitLabel || '保存文章' }}
      </UiButton>

      <UiButton
        v-if="props.article"
        variant="outline"
        :as="'a'"
        :href="props.article.published ? `/posts/${props.article.slug}` : `/posts/${props.article.slug}?preview=1`"
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
