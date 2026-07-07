import { isDatabaseConfigured } from '../database/client'
import { initializeAdminFeatureStore } from '../utils/adminFeatureStore'
import { initializeArticleRepositorySchema } from '../utils/articleRepository'

export default defineNitroPlugin(() => {
  if (!isDatabaseConfigured()) {
    return
  }

  void initializeArticleRepositorySchema().catch((error) => {
    console.error('[articles] schema bootstrap failed:', error)
  })

  void initializeAdminFeatureStore().catch((error) => {
    console.error('[admin-features] bootstrap failed:', error)
  })
})
