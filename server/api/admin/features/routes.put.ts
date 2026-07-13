import { createError, readBody } from 'h3'
import { updateAdminFeatureSection } from '../../../utils/adminFeatureStore'

export default defineEventHandler(async (event) => {
  const body = await readBody<Record<string, unknown>>(event)

  if (!Array.isArray(body.routes)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Routes payload is required',
    })
  }

  return {
    routes: await updateAdminFeatureSection('routes', body.routes),
  }
})
