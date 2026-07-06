import { readAdminSettingSections } from '../../../utils/adminFeatureStore'

export default defineEventHandler(async () => {
  return await readAdminSettingSections()
})
