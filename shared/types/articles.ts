export const ARTICLE_COVER_LAYOUTS = ['split-right', 'split-left', 'top-hero'] as const

export type ArticleCoverLayout = (typeof ARTICLE_COVER_LAYOUTS)[number]

export const DEFAULT_ARTICLE_COVER_LAYOUT: ArticleCoverLayout = 'split-right'

export interface ManagedArticleSummary {
  id: string
  slug: string
  title: string
  summary: string
  description: string
  categoryId: string
  coverImage: string
  coverLayout: ArticleCoverLayout
  viewCount: number
  published: boolean
  pinned: boolean
  createdAt: string
  updatedAt: string
  path: string
}

export interface AdminArticleListResponse {
  configMissing: boolean
  articles: ManagedArticleSummary[]
  total: number
  page: number
  page_size: number
}

export interface ManagedArticle extends ManagedArticleSummary {
  content: string
}

export interface ManagedArticlePayload {
  title: string
  slug: string
  summary: string
  categoryId: string
  coverImage: string
  coverLayout: ArticleCoverLayout
  published: boolean
  pinned: boolean
  content: string
}
