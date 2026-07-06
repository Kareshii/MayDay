import { boolean, index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
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
  pinned: boolean
  createdAt: Date
  updatedAt: Date
}

export type InsertArticleRecord = Partial<ArticleRecord>

const adminSettings = pgTable('admin_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

const adminNavigation = pgTable('admin_navigation', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  path: text('path').notNull(),
  type: text('link_type').notNull(),
  parentId: text('parent_id').default('').notNull(),
  order: integer('sort_order').default(0).notNull(),
  enabled: boolean('enabled').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  index('admin_navigation_order_idx').on(table.order),
  index('admin_navigation_parent_idx').on(table.parentId),
])

const adminCategories = pgTable('admin_categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  parentId: text('parent_id').default('').notNull(),
  order: integer('sort_order').default(0).notNull(),
  description: text('description').default('').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  index('admin_categories_slug_idx').on(table.slug),
  index('admin_categories_parent_idx').on(table.parentId),
  index('admin_categories_order_idx').on(table.order),
])

const adminComments = pgTable('admin_comments', {
  id: text('id').primaryKey(),
  author: text('author').notNull(),
  email: text('email').default('').notNull(),
  articleSlug: text('article_slug').default('').notNull(),
  content: text('content').notNull(),
  status: text('status').default('pending').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  index('admin_comments_status_idx').on(table.status),
  index('admin_comments_article_slug_idx').on(table.articleSlug),
  index('admin_comments_created_at_idx').on(table.createdAt),
])

const adminFriendLinks = pgTable('admin_friend_links', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  url: text('url').notNull(),
  description: text('description').default('').notNull(),
  order: integer('sort_order').default(0).notNull(),
  enabled: boolean('enabled').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  index('admin_friend_links_order_idx').on(table.order),
  index('admin_friend_links_enabled_idx').on(table.enabled),
])

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
    pinned: boolean('pinned').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  }, table => [
    index(`${tableName}_slug_idx`).on(table.slug),
    index(`${tableName}_published_idx`).on(table.published),
    index(`${tableName}_pinned_idx`).on(table.pinned),
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
    adminNavigation,
    adminCategories,
    adminComments,
    adminFriendLinks,
  }
}

// Export a concrete table so drizzle-kit can always discover and push it.
const articles = getArticlesTable()

export {
  articles,
  adminSettings,
  adminNavigation,
  adminCategories,
  adminComments,
  adminFriendLinks,
}
