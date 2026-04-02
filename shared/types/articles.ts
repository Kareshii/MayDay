export interface ManagedArticleSummary {
  id: string
  slug: string
  title: string
  summary: string
  description: string
  coverImage: string
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
  published: boolean
  content: string
}
