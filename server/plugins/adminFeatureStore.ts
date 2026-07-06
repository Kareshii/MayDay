import { isDatabaseConfigured } from '../database/client'
import { initializeAdminFeatureStore } from '../utils/adminFeatureStore'

export default defineNitroPlugin(() => {
  if (!isDatabaseConfigured()) {
    return
  }

  void initializeAdminFeatureStore().catch((error) => {
    console.error('[admin-features] bootstrap failed:', error)
  })
})
