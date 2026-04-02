import { boolean, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const articles = pgTable('articles', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  summary: text('summary').default('').notNull(),
  coverImage: text('cover_image').default('').notNull(),
  content: text('content').notNull(),
  published: boolean('published').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  index('articles_slug_idx').on(table.slug),
  index('articles_published_idx').on(table.published),
  index('articles_updated_at_idx').on(table.updatedAt),
])

export const adminSettings = pgTable('admin_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export type ArticleRecord = typeof articles.$inferSelect
export type InsertArticleRecord = typeof articles.$inferInsert
