import { readAdminFeatureState } from '../../../utils/adminFeatureStore'

export default defineEventHandler(async () => {
  return await readAdminFeatureState()
})
