import { createError, readBody } from 'h3'
import { updateAdminFeatureSection } from '../../../utils/adminFeatureStore'

export default defineEventHandler(async (event) => {
  const body = await readBody<Record<string, unknown>>(event)

  if (!body.site || typeof body.site !== 'object') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Site payload is required',
    })
  }

  return {
    site: await updateAdminFeatureSection('site', body.site),
  }
})
