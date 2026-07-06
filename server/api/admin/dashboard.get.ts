import { isDatabaseConfigured } from '../../database/client'
import { getDashboardData } from '../../utils/articleRepository'
import { readAdminExtensionStats } from '../../utils/adminFeatureStore'
import { readCachedContentImageStats } from '../../utils/contentImageStorage'

async function getAdminExtensionStats() {
  const stats = await readAdminExtensionStats()
  const images = readCachedContentImageStats()

  return {
    categories: stats.categories,
    comments: stats.comments,
    pendingComments: stats.pendingComments,
    images: images.count,
    imageStorageSize: images.storageSize,
  }
}

export default defineEventHandler(async () => {
  if (!isDatabaseConfigured()) {
    return {
      configMissing: true,
      stats: {
        total: 0,
        published: 0,
        drafts: 0,
        pinned: 0,
        latestUpdatedAt: null,
      },
      byMonth: [],
      recentArticles: [],
      extensionStats: {
        categories: 0,
        comments: 0,
        pendingComments: 0,
        images: 0,
        imageStorageSize: 0,
      },
    }
  }

  const [dashboardData, extensionStats] = await Promise.all([
    getDashboardData(),
    getAdminExtensionStats(),
  ])

  return {
    ...dashboardData,
    extensionStats,
  }
})
