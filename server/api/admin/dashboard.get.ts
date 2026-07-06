import { isDatabaseConfigured } from '../../database/client'
import { getDashboardData } from '../../utils/articleRepository'
import { readAdminFeatureState } from '../../utils/adminFeatureStore'
import { listContentImages } from '../../utils/contentImageStorage'

async function getAdminExtensionStats() {
  const [features, images] = await Promise.all([
    readAdminFeatureState(),
    listContentImages(),
  ])

  return {
    categories: features.categories.length,
    comments: features.comments.length,
    pendingComments: features.comments.filter(comment => comment.status === 'pending').length,
    images: images.length,
    imageStorageSize: images.reduce((total, image) => total + image.size, 0),
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

  const extensionStats = await getAdminExtensionStats()

  return {
    ...await getDashboardData(),
    extensionStats,
  }
})
