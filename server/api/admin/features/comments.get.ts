import { readAdminComments } from '../../../utils/adminFeatureStore'

export default defineEventHandler(async () => {
  return {
    comments: await readAdminComments(),
  }
})
