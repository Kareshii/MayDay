import { createError, readBody } from 'h3'
import { updateAdminFeatureSection } from '../../../utils/adminFeatureStore'

export default defineEventHandler(async (event) => {
  const body = await readBody<Record<string, unknown>>(event)

  if (!Array.isArray(body.navigation)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Navigation payload is required',
    })
  }

  return {
    navigation: await updateAdminFeatureSection('navigation', body.navigation),
  }
})
