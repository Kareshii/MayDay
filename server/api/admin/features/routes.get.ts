import { readAdminRouteSettings } from '../../../utils/adminFeatureStore'

export default defineEventHandler(async () => {
  return {
    routes: await readAdminRouteSettings(),
  }
})
