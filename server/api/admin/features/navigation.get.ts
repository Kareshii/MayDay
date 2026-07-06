import { readAdminNavigation } from '../../../utils/adminFeatureStore'

export default defineEventHandler(async () => {
  return {
    navigation: await readAdminNavigation(),
  }
})
