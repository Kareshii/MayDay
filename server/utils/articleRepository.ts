import { and, desc, eq, ilike, or, sql, type SQL } from 'drizzle-orm'
import { createError } from 'h3'
import { articleViewEvents, getArticlesTable, type ArticleRecord } from '../database/schema'
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
  'id' | 'slug' | 'title' | 'summary' | 'categoryId' | 'coverImage' | 'coverLayout' | 'viewCount' | 'published' | 'pinned' | 'createdAt' | 'updatedAt'
>

export interface PublicArticleSearchResult {
  id: string
  title: string
  summary: string
  excerpt: string
  path: string
  updatedAt: string
}

export interface AdminArticleListOptions {
  page: number
  pageSize: number
  search?: string
  status?: 'all' | 'published' | 'draft'
}

const articleCoverLayoutSet = new Set<ArticleCoverLayout>(ARTICLE_COVER_LAYOUTS)
const ensuredArticlesSchema = new Set<string>()
const ensuringArticlesSchema = new Map<string, Promise<void>>()
const articleSchemaErrorCodes = new Set(['42P01', '42703'])

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
    categoryId: record.categoryId,
    coverImage: record.coverImage,
    coverLayout: normalizeCoverLayout(record.coverLayout),
    viewCount: Number(record.viewCount) || 0,
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

function stripSearchText(value: string) {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/[`*_#>\-[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function createSearchExcerpt(content: string, query: string) {
  const text = stripSearchText(content)

  if (!query) {
    return text.slice(0, 120)
  }

  const index = text.toLowerCase().indexOf(query.toLowerCase())
  const start = index > 32 ? index - 32 : 0
  return text.slice(start, start + 140)
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
      ADD COLUMN IF NOT EXISTS category_id text NOT NULL DEFAULT ''
    `))
    await db.execute(sql.raw(`
      ALTER TABLE ${quotedTableName}
      ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false
    `))
    await db.execute(sql.raw(`
      ALTER TABLE ${quotedTableName}
      ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0
    `))
    await db.execute(sql.raw(`
      CREATE TABLE IF NOT EXISTS article_view_events (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        article_id uuid NOT NULL,
        visitor_hash text NOT NULL,
        viewed_on text NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
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
      CREATE INDEX IF NOT EXISTS ${quoteIdentifier(`${tableName}_category_id_idx`)}
      ON ${quotedTableName} (category_id)
    `))
    await db.execute(sql.raw(`
      CREATE INDEX IF NOT EXISTS ${quoteIdentifier(`${tableName}_created_at_idx`)}
      ON ${quotedTableName} (created_at)
    `))
    await db.execute(sql.raw(`
      CREATE INDEX IF NOT EXISTS ${quoteIdentifier(`${tableName}_updated_at_idx`)}
      ON ${quotedTableName} (updated_at)
    `))
    await db.execute(sql.raw(`
      CREATE UNIQUE INDEX IF NOT EXISTS article_view_events_unique_idx
      ON article_view_events (article_id, visitor_hash, viewed_on)
    `))
    await db.execute(sql.raw(`
      CREATE INDEX IF NOT EXISTS article_view_events_article_idx
      ON article_view_events (article_id)
    `))
    await db.execute(sql.raw(`
      CREATE INDEX IF NOT EXISTS article_view_events_viewed_on_idx
      ON article_view_events (viewed_on)
    `))
    ensuredArticlesSchema.add(tableName)
  })().finally(() => {
    ensuringArticlesSchema.delete(tableName)
  })

  ensuringArticlesSchema.set(tableName, task)
  await task
}

function isArticleSchemaError(error: unknown) {
  return Boolean(
    error
    && typeof error === 'object'
    && 'code' in error
    && articleSchemaErrorCodes.has(String(error.code)),
  )
}

async function withArticleSchemaFallback<T>(task: () => Promise<T>) {
  try {
    return await task()
  } catch (error) {
    if (!isArticleSchemaError(error)) {
      throw error
    }

    await ensureArticlesSchema()
    return await task()
  }
}

export async function initializeArticleRepositorySchema() {
  await ensureArticlesSchema()
}

function validatePayload(payload: Partial<ManagedArticlePayload>) {
  const title = String(payload.title || '').trim()
  const slug = normalizeArticleSlug(String(payload.slug || title)) || `article-${Date.now()}`
  const content = String(payload.content || '').trim()

  if (!title) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Title is required',
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
    categoryId: String(payload.categoryId || '').trim(),
    coverImage: String(payload.coverImage || '').trim(),
    coverLayout: normalizeCoverLayout(payload.coverLayout),
    published: payload.published === true,
    pinned: payload.pinned === true,
    content,
  } satisfies ManagedArticlePayload
}

async function findBySlugRecord(slug: string) {
  const db = useDatabase()
  const articles = getArticlesTable()
  const rows = await db.select().from(articles).where(eq(articles.slug, slug)).limit(1)
  return rows[0] ?? null
}

async function findByIdRecord(id: string) {
  const db = useDatabase()
  const articles = getArticlesTable()
  const rows = await db.select().from(articles).where(eq(articles.id, id)).limit(1)
  return rows[0] ?? null
}

async function findById(id: string) {
  await ensureArticlesSchema()
  return await findByIdRecord(id)
}

export async function listAdminArticles(options: AdminArticleListOptions) {
  await ensureArticlesSchema()
  const db = useDatabase()
  const articles = getArticlesTable()
  const pageSize = Math.min(100, Math.max(1, Math.trunc(options.pageSize)))
  const requestedPage = Math.max(1, Math.trunc(options.page))
  const conditions: SQL[] = []
  const search = options.search?.trim()

  if (options.status === 'published') {
    conditions.push(eq(articles.published, true))
  } else if (options.status === 'draft') {
    conditions.push(eq(articles.published, false))
  }

  if (search) {
    const pattern = `%${search}%`
    const searchCondition = or(
      ilike(articles.title, pattern),
      ilike(articles.slug, pattern),
      ilike(articles.summary, pattern),
    )

    if (searchCondition) {
      conditions.push(searchCondition)
    }
  }

  const whereCondition = conditions.length ? and(...conditions) : undefined
  const countRows = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(articles)
    .where(whereCondition)
  const total = Number(countRows[0]?.total) || 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(requestedPage, totalPages)
  const rows = await db
    .select({
      id: articles.id,
      slug: articles.slug,
      title: articles.title,
      summary: articles.summary,
      categoryId: articles.categoryId,
      coverImage: articles.coverImage,
      coverLayout: articles.coverLayout,
      viewCount: articles.viewCount,
      published: articles.published,
      pinned: articles.pinned,
      createdAt: articles.createdAt,
      updatedAt: articles.updatedAt,
    })
    .from(articles)
    .where(whereCondition)
    .orderBy(desc(articles.pinned), desc(articles.updatedAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize)

  return {
    articles: rows.map(serializeArticleSummary),
    total,
    page,
    pageSize,
  }
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
      categoryId: articles.categoryId,
      coverImage: articles.coverImage,
      coverLayout: articles.coverLayout,
      viewCount: articles.viewCount,
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

export async function searchPublicArticles(query: string, limit = 12): Promise<PublicArticleSearchResult[]> {
  await ensureArticlesSchema()
  const db = useDatabase()
  const articles = getArticlesTable()
  const normalizedQuery = query.trim().toLowerCase()
  const rows = await db
    .select({
      id: articles.id,
      slug: articles.slug,
      title: articles.title,
      summary: articles.summary,
      content: articles.content,
      updatedAt: articles.updatedAt,
    })
    .from(articles)
    .where(eq(articles.published, true))
    .orderBy(desc(articles.updatedAt))

  return rows
    .map((article) => {
      const title = stripSearchText(article.title)
      const summary = stripSearchText(article.summary)
      const content = stripSearchText(article.content)
      const haystack = `${title} ${summary} ${content}`.toLowerCase()
      const titleMatched = normalizedQuery && title.toLowerCase().includes(normalizedQuery)
      const summaryMatched = normalizedQuery && summary.toLowerCase().includes(normalizedQuery)
      const contentMatched = normalizedQuery && content.toLowerCase().includes(normalizedQuery)

      return {
        id: article.id,
        title,
        summary,
        excerpt: createSearchExcerpt(article.content, normalizedQuery),
        path: `/detail/${article.slug}`,
        updatedAt: article.updatedAt.toISOString(),
        score: normalizedQuery
          ? Number(titleMatched) * 4 + Number(summaryMatched) * 2 + Number(contentMatched)
          : 1,
        matched: normalizedQuery ? haystack.includes(normalizedQuery) : true,
      }
    })
    .filter(item => item.matched)
    .sort((left, right) => right.score - left.score || right.updatedAt.localeCompare(left.updatedAt))
    .slice(0, limit)
    .map(({ score, matched, ...item }) => item)
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
  const article = validatePayload(payload)

  return await withArticleSchemaFallback(async () => {
    const db = useDatabase()
    const articles = getArticlesTable()
    const existing = await findBySlugRecord(article.slug)

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
      categoryId: article.categoryId,
      coverLayout: article.coverLayout,
      content: article.content,
      published: article.published,
      pinned: article.pinned,
      viewCount: 0,
      createdAt: now,
      updatedAt: now,
    }).returning()

    return serializeArticle(rows[0]!)
  })
}

export async function updateArticle(id: string, payload: ManagedArticlePayload) {
  const article = validatePayload(payload)

  return await withArticleSchemaFallback(async () => {
    const db = useDatabase()
    const articles = getArticlesTable()
    const conflict = await findBySlugRecord(article.slug)

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
        categoryId: article.categoryId,
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

    return serializeArticle(rows[0])
  })
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
      categoryId: articles.categoryId,
      coverImage: articles.coverImage,
      coverLayout: articles.coverLayout,
      viewCount: articles.viewCount,
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

export async function updateArticlePublished(id: string, published: boolean) {
  await ensureArticlesSchema()
  const db = useDatabase()
  const articles = getArticlesTable()
  const rows = await db
    .update(articles)
    .set({
      published,
      updatedAt: new Date(),
    })
    .where(eq(articles.id, id))
    .returning({
      id: articles.id,
      slug: articles.slug,
      title: articles.title,
      summary: articles.summary,
      categoryId: articles.categoryId,
      coverImage: articles.coverImage,
      coverLayout: articles.coverLayout,
      viewCount: articles.viewCount,
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

export async function recordPublicArticleView(slug: string, visitorHash: string, viewedOn: string) {
  await ensureArticlesSchema()
  const db = useDatabase()
  const articles = getArticlesTable()
  const articleRows = await db
    .select({
      id: articles.id,
      viewCount: articles.viewCount,
    })
    .from(articles)
    .where(and(eq(articles.slug, slug), eq(articles.published, true)))
    .limit(1)
  const article = articleRows[0]

  if (!article) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Article not found',
    })
  }

  const insertedRows = await db
    .insert(articleViewEvents)
    .values({
      articleId: article.id,
      visitorHash,
      viewedOn,
    })
    .onConflictDoNothing({
      target: [
        articleViewEvents.articleId,
        articleViewEvents.visitorHash,
        articleViewEvents.viewedOn,
      ],
    })
    .returning({ id: articleViewEvents.id })

  if (!insertedRows[0]) {
    return {
      counted: false,
      viewCount: Number(article.viewCount) || 0,
    }
  }

  const rows = await db
    .update(articles)
    .set({
      viewCount: sql`${articles.viewCount} + 1`,
    })
    .where(eq(articles.id, article.id))
    .returning({
      viewCount: articles.viewCount,
    })

  return {
    counted: true,
    viewCount: Number(rows[0]?.viewCount ?? article.viewCount + 1) || 0,
  }
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
        categoryId: articles.categoryId,
        coverImage: articles.coverImage,
        coverLayout: articles.coverLayout,
        viewCount: articles.viewCount,
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
