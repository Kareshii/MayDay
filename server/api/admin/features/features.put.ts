import { createError, readBody } from 'h3'
import { updateAdminFeatureSection } from '../../../utils/adminFeatureStore'

export default defineEventHandler(async (event) => {
  const body = await readBody<Record<string, unknown>>(event)

  if (!body.features || typeof body.features !== 'object') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Features payload is required',
    })
  }

  return {
    features: await updateAdminFeatureSection('features', body.features),
  }
})
