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
          <div class="mb-4 flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold text-[var(--text-primary)]">
                正文内容
              </p>
              <p class="mt-1 text-xs text-[var(--text-secondary)]">
                使用 TinyMCE 富文本编辑器撰写正文
              </p>
            </div>
            <UiBadge variant="secondary">
              HTML
            </UiBadge>
          </div>

          <TinyMceEditor v-model="form.content" :disabled="formDisabled" />
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
            特色封面
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
            <li>封面图建议 21:9 或 16:9 横图。</li>
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
