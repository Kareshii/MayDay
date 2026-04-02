import { isDatabaseConfigured } from '../../../database/client'
import { listAdminArticles } from '../../../utils/articleRepository'

export default defineEventHandler(async () => {
  if (!isDatabaseConfigured()) {
    return {
      configMissing: true,
      articles: [],
    }
  }

  return {
    configMissing: false,
    articles: await listAdminArticles(),
  }
})
