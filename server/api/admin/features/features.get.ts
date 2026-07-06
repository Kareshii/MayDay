import { readAdminFeatureSettings } from '../../../utils/adminFeatureStore'

export default defineEventHandler(async () => {
  return {
    features: await readAdminFeatureSettings(),
  }
})
