import { readAdminCategories } from '../../../utils/adminFeatureStore'

export default defineEventHandler(async () => {
  return {
    categories: await readAdminCategories(),
  }
})
