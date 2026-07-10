<script setup lang="ts">
import type { PublicArticleComment } from '~~/shared/types/comments'

defineProps<{
  comments: PublicArticleComment[]
}>()

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'Asia/Shanghai',
})

function formatCommentDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date)
}

function getAuthorInitial(author: string) {
  return Array.from(author.trim() || '匿')[0]
}
</script>

<template>
  <section aria-labelledby="article-comments-title" class="mt-14 border-t border-[var(--border)] pt-8">
    <header class="flex items-end justify-between gap-4">
      <div>
        <p class="section-kicker">COMMENTS</p>
        <h2 id="article-comments-title" class="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
          评论
        </h2>
      </div>
      <span class="text-sm text-[var(--text-secondary)]">{{ comments.length }} 条</span>
    </header>

    <p v-if="!comments.length" class="mt-6 border-y border-[var(--border)] py-8 text-sm text-[var(--text-secondary)]">
      暂无已通过的评论。
    </p>

    <ul v-else class="mt-6 divide-y divide-[var(--border)] border-y border-[var(--border)]">
      <li
        v-for="comment in comments"
        :key="comment.id"
        class="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-4 py-6"
      >
        <span class="flex size-11 items-center justify-center rounded-full bg-[var(--primary-soft)] text-sm font-semibold text-[var(--primary)]">
          {{ getAuthorInitial(comment.author) }}
        </span>
        <div class="min-w-0">
          <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h3 class="font-semibold text-[var(--text-primary)]">{{ comment.author }}</h3>
            <time :datetime="comment.createdAt" class="text-xs text-[var(--text-secondary)]">
              {{ formatCommentDate(comment.createdAt) }}
            </time>
          </div>
          <p class="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-[var(--text-secondary)]">
            {{ comment.content }}
          </p>
        </div>
      </li>
    </ul>
  </section>
</template>
