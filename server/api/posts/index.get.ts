import { isDatabaseConfigured } from '../../database/client'
import { listPublicArticles } from '../../utils/articleRepository'

export default defineEventHandler(async () => {
  if (!isDatabaseConfigured()) {
    return {
      articles: [],
    }
  }

  return {
    articles: await listPublicArticles(),
  }
})
