import { and, desc, eq } from 'drizzle-orm'
import { createError } from 'h3'
import { getArticlesTable, type ArticleRecord } from '../database/schema'
import { useDatabase } from '../database/client'
import type { ManagedArticle, ManagedArticlePayload, ManagedArticleSummary } from '~~/shared/types/articles'
import { normalizeArticleSlug } from '~~/shared/utils/articleSlug'

function serializeArticle(record: ArticleRecord): ManagedArticle {
  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    summary: record.summary,
    description: record.summary,
    coverImage: record.coverImage,
    published: record.published,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    path: `/posts/${record.slug}`,
    content: record.content,
  }
}

function toSummary(article: ManagedArticle): ManagedArticleSummary {
  const { content, ...summary } = article
  void content
  return summary
}

function validatePayload(payload: Partial<ManagedArticlePayload>) {
  const title = String(payload.title || '').trim()
  const slug = normalizeArticleSlug(String(payload.slug || title))
  const content = String(payload.content || '').trim()

  if (!title) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Title is required',
    })
  }

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Slug is required',
    })
  }

  if (!content) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Content is required',
    })
  }

  return {
    title,
    slug,
    summary: String(payload.summary || '').trim(),
    coverImage: String(payload.coverImage || '').trim(),
    published: payload.published === true,
    content,
  } satisfies ManagedArticlePayload
}

async function findBySlug(slug: string) {
  const db = useDatabase()
  const articles = getArticlesTable()
  const rows = await db.select().from(articles).where(eq(articles.slug, slug)).limit(1)
  return rows[0] ?? null
}

async function findById(id: string) {
  const db = useDatabase()
  const articles = getArticlesTable()
  const rows = await db.select().from(articles).where(eq(articles.id, id)).limit(1)
  return rows[0] ?? null
}

export async function listAdminArticles() {
  const db = useDatabase()
  const articles = getArticlesTable()
  const rows = await db.select().from(articles).orderBy(desc(articles.updatedAt))
  return rows.map(row => toSummary(serializeArticle(row)))
}

export async function listPublicArticles() {
  const db = useDatabase()
  const articles = getArticlesTable()
  const rows = await db
    .select()
    .from(articles)
    .where(eq(articles.published, true))
    .orderBy(desc(articles.updatedAt))

  return rows.map(row => toSummary(serializeArticle(row)))
}

export async function getAdminArticle(id: string) {
  const record = await findById(id)

  if (!record) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Article not found',
    })
  }

  return serializeArticle(record)
}

export async function getPublicArticleBySlug(slug: string, includeDraft = false) {
  const db = useDatabase()
  const articles = getArticlesTable()
  const conditions = includeDraft
    ? eq(articles.slug, slug)
    : and(eq(articles.slug, slug), eq(articles.published, true))

  const rows = await db
    .select()
    .from(articles)
    .where(conditions)
    .limit(1)

  const record = rows[0]

  if (!record) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Article not found',
    })
  }

  return serializeArticle(record)
}

export async function createArticle(payload: ManagedArticlePayload) {
  const db = useDatabase()
  const articles = getArticlesTable()
  const article = validatePayload(payload)
  const existing = await findBySlug(article.slug)

  if (existing) {
    throw createError({
      statusCode: 409,
      statusMessage: 'An article with this slug already exists',
    })
  }

  const now = new Date()
  const rows = await db.insert(articles).values({
    slug: article.slug,
    title: article.title,
    summary: article.summary,
    coverImage: article.coverImage,
    content: article.content,
    published: article.published,
    createdAt: now,
    updatedAt: now,
  }).returning()

  return serializeArticle(rows[0]!)
}

export async function updateArticle(id: string, payload: ManagedArticlePayload) {
  const db = useDatabase()
  const articles = getArticlesTable()
  const existing = await getAdminArticle(id)
  const article = validatePayload(payload)
  const conflict = await findBySlug(article.slug)

  if (conflict && conflict.id !== id) {
    throw createError({
      statusCode: 409,
      statusMessage: 'An article with this slug already exists',
    })
  }

  const rows = await db
    .update(articles)
    .set({
      slug: article.slug,
      title: article.title,
      summary: article.summary,
      coverImage: article.coverImage,
      content: article.content,
      published: article.published,
      updatedAt: new Date(),
    })
    .where(eq(articles.id, id))
    .returning()

  if (!rows[0]) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Article not found',
    })
  }

  void existing
  return serializeArticle(rows[0])
}

export async function deleteArticle(id: string) {
  const db = useDatabase()
  const articles = getArticlesTable()
  const rows = await db.delete(articles).where(eq(articles.id, id)).returning({ id: articles.id })

  if (!rows[0]) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Article not found',
    })
  }
}

export async function getDashboardData() {
  const articles = await listAdminArticles()
  const published = articles.filter(article => article.published).length
  const drafts = articles.length - published

  const monthMap = new Map<string, number>()
  const formatter = new Intl.DateTimeFormat('en-US', { month: 'short' })

  articles.forEach((article) => {
    const date = new Date(article.createdAt)
    const key = `${date.getFullYear()}-${date.getMonth()}`
    monthMap.set(key, (monthMap.get(key) || 0) + 1)
  })

  const byMonth = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([key, value]) => {
      const parts = key.split('-').map(Number)
      const year = parts[0] ?? 0
      const month = parts[1] ?? 0
      return {
        label: `${formatter.format(new Date(year, month, 1))} ${String(year).slice(-2)}`,
        value,
      }
    })

  return {
    stats: {
      total: articles.length,
      published,
      drafts,
      latestUpdatedAt: articles[0]?.updatedAt || null,
    },
    byMonth,
    recentArticles: articles.slice(0, 6),
  }
}
