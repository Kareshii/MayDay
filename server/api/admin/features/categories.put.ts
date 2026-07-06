import { createError, readBody } from 'h3'
import { updateAdminFeatureSection } from '../../../utils/adminFeatureStore'

export default defineEventHandler(async (event) => {
  const body = await readBody<Record<string, unknown>>(event)

  if (!Array.isArray(body.categories)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Categories payload is required',
    })
  }

  return {
    categories: await updateAdminFeatureSection('categories', body.categories),
  }
})
