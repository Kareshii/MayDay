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
  <section aria-labelledby="article-comments-title" class="article-comments">
    <header class="article-comments__header">
      <div><p class="article-comments__eyebrow">02 / DISCUSSION</p><h2 id="article-comments-title">评论<span>Conversation.</span></h2></div>
      <span class="article-comments__count">{{ String(comments.length).padStart(2, '0') }}</span>
    </header>
    <p v-if="!comments.length" class="article-comments__empty">暂无已通过的评论。</p>
    <ul v-else class="article-comments__list">
      <li v-for="comment in comments" :key="comment.id" class="article-comment">
        <span class="article-comment__avatar">{{ getAuthorInitial(comment.author) }}</span>
        <div class="min-w-0">
          <div class="article-comment__byline"><h3>{{ comment.author }}</h3><time :datetime="comment.createdAt">{{ formatCommentDate(comment.createdAt) }}</time></div>
          <p class="article-comment__text">{{ comment.content }}</p>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.article-comments { max-width: 52rem; margin-top: clamp(5rem, 9vw, 9rem); padding-top: 2rem; border-top: 1px solid var(--border-strong); }
.article-comments__header { display: flex; justify-content: space-between; align-items: flex-end; gap: 1.5rem; padding-bottom: 2rem; }
.article-comments__eyebrow { color: var(--text-muted); font-size: .6rem; letter-spacing: .17em; }
.article-comments h2 { margin-top: 1.3rem; color: var(--text-primary); font-size: clamp(1.8rem, 3vw, 2.7rem); font-weight: 400; letter-spacing: -.045em; }
.article-comments h2 span { display: block; margin-top: .3rem; color: var(--text-secondary); font-size: .5em; font-weight: 300; letter-spacing: -.01em; }
.article-comments__count { color: transparent; -webkit-text-stroke: 1px var(--text-muted); font-size: clamp(3.5rem, 7vw, 6rem); font-weight: 300; line-height: 1; letter-spacing: -.06em; }
.article-comments__empty { padding-block: 2rem; border-block: 1px solid var(--border); color: var(--text-muted); font-size: .8rem; }
.article-comment { display: grid; grid-template-columns: 2.5rem minmax(0, 1fr); gap: 1.5rem; padding-block: 2rem; border-top: 1px solid var(--border); }
.article-comment:last-child { border-bottom: 1px solid var(--border); }
.article-comment__avatar { display: flex; width: 2.5rem; height: 2.5rem; align-items: center; justify-content: center; border: 1px solid var(--border-strong); color: var(--text-primary); font-size: .75rem; }
.article-comment__byline { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: .5rem 1rem; }
.article-comment h3 { color: var(--text-primary); font-size: .85rem; font-weight: 500; }
.article-comment time { color: var(--text-muted); font-size: .6rem; }
.article-comment__text { margin-top: 1rem; white-space: pre-wrap; overflow-wrap: anywhere; color: var(--text-secondary); font-size: .85rem; line-height: 1.9; }
@media (max-width: 639px) { .article-comment { gap: 1rem; } }
</style>
