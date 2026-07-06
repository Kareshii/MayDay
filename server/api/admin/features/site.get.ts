import { readAdminSiteSettings } from '../../../utils/adminFeatureStore'

export default defineEventHandler(async () => {
  return {
    site: await readAdminSiteSettings(),
  }
})
