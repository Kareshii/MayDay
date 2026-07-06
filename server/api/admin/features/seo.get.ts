import { readAdminSeoSettings } from '../../../utils/adminFeatureStore'

export default defineEventHandler(async () => {
  return {
    seo: await readAdminSeoSettings(),
  }
})
