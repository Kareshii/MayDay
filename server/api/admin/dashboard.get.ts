import { isDatabaseConfigured } from '../../database/client'
import { getDashboardData } from '../../utils/articleRepository'

export default defineEventHandler(async () => {
  if (!isDatabaseConfigured()) {
    return {
      configMissing: true,
      stats: {
        total: 0,
        published: 0,
        drafts: 0,
        latestUpdatedAt: null,
      },
      byMonth: [],
      recentArticles: [],
    }
  }

  return await getDashboardData()
})
