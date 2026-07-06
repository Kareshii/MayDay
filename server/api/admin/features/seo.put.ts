import { createError, readBody } from 'h3'
import { updateAdminFeatureSection } from '../../../utils/adminFeatureStore'

export default defineEventHandler(async (event) => {
  const body = await readBody<Record<string, unknown>>(event)

  if (!body.seo || typeof body.seo !== 'object') {
    throw createError({
      statusCode: 400,
      statusMessage: 'SEO payload is required',
    })
  }

  return {
    seo: await updateAdminFeatureSection('seo', body.seo),
  }
})
