import { readAdminContentSettings } from '../../../utils/adminFeatureStore'

export default defineEventHandler(async () => {
  return {
    content: await readAdminContentSettings(),
  }
})
