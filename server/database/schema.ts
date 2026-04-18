import { boolean, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { getConfiguredArticleTableName } from '../utils/runtimeSetup'

export interface ArticleRecord {
  id: string
  slug: string
  title: string
  summary: string
  coverImage: string
  coverLayout: string
  content: string
  published: boolean
  createdAt: Date
  updatedAt: Date
}

export type InsertArticleRecord = Partial<ArticleRecord>

const adminSettings = pgTable('admin_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

type ArticlesTable = ReturnType<typeof createArticlesTable>

let cachedArticlesTableName: string | null = null
let cachedArticlesTable: ArticlesTable | null = null

function createArticlesTable(tableName: string) {
  return pgTable(tableName, {
    id: uuid('id').defaultRandom().primaryKey(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    summary: text('summary').default('').notNull(),
    coverImage: text('cover_image').default('').notNull(),
    coverLayout: text('cover_layout').default('split-right').notNull(),
    content: text('content').notNull(),
    published: boolean('published').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  }, table => [
    index(`${tableName}_slug_idx`).on(table.slug),
    index(`${tableName}_published_idx`).on(table.published),
    index(`${tableName}_updated_at_idx`).on(table.updatedAt),
  ])
}

export function getArticlesTable() {
  const tableName = getConfiguredArticleTableName()

  if (!cachedArticlesTable || cachedArticlesTableName !== tableName) {
    cachedArticlesTableName = tableName
    cachedArticlesTable = createArticlesTable(tableName)
  }

  return cachedArticlesTable
}

export function getDatabaseSchema() {
  return {
    articles: getArticlesTable(),
    adminSettings,
  }
}

// Export a concrete table so drizzle-kit can always discover and push it.
const articles = getArticlesTable()

export { articles, adminSettings }
