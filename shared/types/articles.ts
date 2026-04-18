export const ARTICLE_COVER_LAYOUTS = ['split-right', 'split-left', 'top-hero'] as const

export type ArticleCoverLayout = (typeof ARTICLE_COVER_LAYOUTS)[number]

export const DEFAULT_ARTICLE_COVER_LAYOUT: ArticleCoverLayout = 'split-right'

export interface ManagedArticleSummary {
  id: string
  slug: string
  title: string
  summary: string
  description: string
  coverImage: string
  coverLayout: ArticleCoverLayout
  published: boolean
  createdAt: string
  updatedAt: string
  path: string
}

export interface ManagedArticle extends ManagedArticleSummary {
  content: string
}

export interface ManagedArticlePayload {
  title: string
  slug: string
  summary: string
  coverImage: string
  coverLayout: ArticleCoverLayout
  published: boolean
  content: string
}
