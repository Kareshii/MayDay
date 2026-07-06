import { and, desc, eq, sql } from 'drizzle-orm'
import { createError } from 'h3'
import { getArticlesTable, type ArticleRecord } from '../database/schema'
import { useDatabase } from '../database/client'
import { getConfiguredArticleTableName } from './runtimeSetup'
import {
  ARTICLE_COVER_LAYOUTS,
  DEFAULT_ARTICLE_COVER_LAYOUT,
  type ArticleCoverLayout,
  type ManagedArticle,
  type ManagedArticlePayload,
  type ManagedArticleSummary,
} from '~~/shared/types/articles'
import { normalizeArticleSlug } from '~~/shared/utils/articleSlug'

type ArticleSummaryRecord = Pick<
  ArticleRecord,
  'id' | 'slug' | 'title' | 'summary' | 'coverImage' | 'coverLayout' | 'published' | 'pinned' | 'createdAt' | 'updatedAt'
>

const articleCoverLayoutSet = new Set<ArticleCoverLayout>(ARTICLE_COVER_LAYOUTS)
const ensuredArticlesSchema = new Set<string>()
const ensuringArticlesSchema = new Map<string, Promise<void>>()

function quoteIdentifier(identifier: string) {
  return `"${identifier.replaceAll('"', '""')}"`
}

function normalizeCoverLayout(rawLayout?: string | null): ArticleCoverLayout {
  const layout = String(rawLayout || '').trim() as ArticleCoverLayout
  return articleCoverLayoutSet.has(layout) ? layout : DEFAULT_ARTICLE_COVER_LAYOUT
}

function serializeArticleSummary(record: ArticleSummaryRecord): ManagedArticleSummary {
  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    summary: record.summary,
    description: record.summary,
    coverImage: record.coverImage,
    coverLayout: normalizeCoverLayout(record.coverLayout),
    published: record.published,
    pinned: record.pinned,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    path: `/detail/${record.slug}`,
  }
}

function serializeArticle(record: ArticleRecord): ManagedArticle {
  return {
    ...serializeArticleSummary(record),
    content: record.content,
  }
}

async function ensureArticlesSchema() {
  const tableName = getConfiguredArticleTableName()

  if (ensuredArticlesSchema.has(tableName)) {
    return
  }

  const runningTask = ensuringArticlesSchema.get(tableName)
  if (runningTask) {
    await runningTask
    return
  }

  const defaultCoverLayout = DEFAULT_ARTICLE_COVER_LAYOUT.replaceAll("'", "''")
  const quotedTableName = quoteIdentifier(tableName)

  const task = (async () => {
    const db = useDatabase()
    await db.execute(sql.raw(`
      ALTER TABLE ${quotedTableName}
      ADD COLUMN IF NOT EXISTS cover_layout text NOT NULL DEFAULT '${defaultCoverLayout}'
    `))
    await db.execute(sql.raw(`
      ALTER TABLE ${quotedTableName}
      ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false
    `))
    await db.execute(sql.raw(`
      CREATE INDEX IF NOT EXISTS ${quoteIdentifier(`${tableName}_published_idx`)}
      ON ${quotedTableName} (published)
    `))
    await db.execute(sql.raw(`
      CREATE INDEX IF NOT EXISTS ${quoteIdentifier(`${tableName}_pinned_idx`)}
      ON ${quotedTableName} (pinned)
    `))
    await db.execute(sql.raw(`
      CREATE INDEX IF NOT EXISTS ${quoteIdentifier(`${tableName}_created_at_idx`)}
      ON ${quotedTableName} (created_at)
    `))
    await db.execute(sql.raw(`
      CREATE INDEX IF NOT EXISTS ${quoteIdentifier(`${tableName}_updated_at_idx`)}
      ON ${quotedTableName} (updated_at)
    `))
    ensuredArticlesSchema.add(tableName)
  })().finally(() => {
    ensuringArticlesSchema.delete(tableName)
  })

  ensuringArticlesSchema.set(tableName, task)
  await task
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
    coverLayout: normalizeCoverLayout(payload.coverLayout),
    published: payload.published === true,
    pinned: payload.pinned === true,
    content,
  } satisfies ManagedArticlePayload
}

async function findBySlug(slug: string) {
  await ensureArticlesSchema()
  const db = useDatabase()
  const articles = getArticlesTable()
  const rows = await db.select().from(articles).where(eq(articles.slug, slug)).limit(1)
  return rows[0] ?? null
}

async function findById(id: string) {
  await ensureArticlesSchema()
  const db = useDatabase()
  const articles = getArticlesTable()
  const rows = await db.select().from(articles).where(eq(articles.id, id)).limit(1)
  return rows[0] ?? null
}

export async function listAdminArticles() {
  await ensureArticlesSchema()
  const db = useDatabase()
  const articles = getArticlesTable()
  const rows = await db
    .select({
      id: articles.id,
      slug: articles.slug,
      title: articles.title,
      summary: articles.summary,
      coverImage: articles.coverImage,
      coverLayout: articles.coverLayout,
      published: articles.published,
      pinned: articles.pinned,
      createdAt: articles.createdAt,
      updatedAt: articles.updatedAt,
    })
    .from(articles)
    .orderBy(desc(articles.pinned), desc(articles.updatedAt))

  return rows.map(serializeArticleSummary)
}

export async function listPublicArticles() {
  await ensureArticlesSchema()
  const db = useDatabase()
  const articles = getArticlesTable()
  const rows = await db
    .select({
      id: articles.id,
      slug: articles.slug,
      title: articles.title,
      summary: articles.summary,
      coverImage: articles.coverImage,
      coverLayout: articles.coverLayout,
      published: articles.published,
      pinned: articles.pinned,
      createdAt: articles.createdAt,
      updatedAt: articles.updatedAt,
    })
    .from(articles)
    .where(eq(articles.published, true))
    .orderBy(desc(articles.pinned), desc(articles.updatedAt))

  return rows.map(serializeArticleSummary)
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
  await ensureArticlesSchema()
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
  await ensureArticlesSchema()
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
    coverLayout: article.coverLayout,
    content: article.content,
    published: article.published,
    pinned: article.pinned,
    createdAt: now,
    updatedAt: now,
  }).returning()

  return serializeArticle(rows[0]!)
}

export async function updateArticle(id: string, payload: ManagedArticlePayload) {
  await ensureArticlesSchema()
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
      coverLayout: article.coverLayout,
      content: article.content,
      published: article.published,
      pinned: article.pinned,
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

export async function updateArticlePinned(id: string, pinned: boolean) {
  await ensureArticlesSchema()
  const db = useDatabase()
  const articles = getArticlesTable()
  const rows = await db
    .update(articles)
    .set({
      pinned,
      updatedAt: new Date(),
    })
    .where(eq(articles.id, id))
    .returning({
      id: articles.id,
      slug: articles.slug,
      title: articles.title,
      summary: articles.summary,
      coverImage: articles.coverImage,
      coverLayout: articles.coverLayout,
      published: articles.published,
      pinned: articles.pinned,
      createdAt: articles.createdAt,
      updatedAt: articles.updatedAt,
    })

  if (!rows[0]) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Article not found',
    })
  }

  return serializeArticleSummary(rows[0])
}

export async function deleteArticle(id: string) {
  await ensureArticlesSchema()
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
  await ensureArticlesSchema()
  const db = useDatabase()
  const articles = getArticlesTable()
  const [statsRows, monthRows, recentRows] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*)::int`,
        published: sql<number>`count(*) filter (where ${articles.published} = true)::int`,
        drafts: sql<number>`count(*) filter (where ${articles.published} = false)::int`,
        pinned: sql<number>`count(*) filter (where ${articles.pinned} = true)::int`,
        latestUpdatedAt: sql<Date | null>`max(${articles.updatedAt})`,
      })
      .from(articles),
    db
      .select({
        monthStart: sql<string>`to_char(date_trunc('month', ${articles.createdAt}), 'YYYY-MM-DD')`,
        value: sql<number>`count(*)::int`,
      })
      .from(articles)
      .groupBy(sql`date_trunc('month', ${articles.createdAt})`)
      .orderBy(sql`date_trunc('month', ${articles.createdAt}) desc`)
      .limit(6),
    db
      .select({
        id: articles.id,
        slug: articles.slug,
        title: articles.title,
        summary: articles.summary,
        coverImage: articles.coverImage,
        coverLayout: articles.coverLayout,
        published: articles.published,
        pinned: articles.pinned,
        createdAt: articles.createdAt,
        updatedAt: articles.updatedAt,
      })
      .from(articles)
      .orderBy(desc(articles.pinned), desc(articles.updatedAt))
      .limit(6),
  ])

  const formatter = new Intl.DateTimeFormat('en-US', { month: 'short' })
  const byMonth = [...monthRows]
    .reverse()
    .map((row) => {
      const parts = row.monthStart.split('-').map(Number)
      const year = parts[0] ?? 0
      const month = (parts[1] ?? 1) - 1
      return {
        label: `${formatter.format(new Date(year, month, 1))} ${String(year).slice(-2)}`,
        value: Number(row.value) || 0,
      }
    })
  const stats = statsRows[0]
  const latestUpdatedAt = stats?.latestUpdatedAt
    ? new Date(stats.latestUpdatedAt).toISOString()
    : null

  return {
    stats: {
      total: Number(stats?.total) || 0,
      published: Number(stats?.published) || 0,
      drafts: Number(stats?.drafts) || 0,
      pinned: Number(stats?.pinned) || 0,
      latestUpdatedAt,
    },
    byMonth,
    recentArticles: recentRows.map(serializeArticleSummary),
  }
}
