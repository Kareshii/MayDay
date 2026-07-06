import { createError, readBody } from 'h3'
import { updateAdminFeatureSection } from '../../../utils/adminFeatureStore'

export default defineEventHandler(async (event) => {
  const body = await readBody<Record<string, unknown>>(event)

  if (!body.content || typeof body.content !== 'object') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Content payload is required',
    })
  }

  return {
    content: await updateAdminFeatureSection('content', body.content),
  }
})
