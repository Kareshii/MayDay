import { createError, readBody } from 'h3'
import { updateAdminFeatureSection } from '../../../utils/adminFeatureStore'

export default defineEventHandler(async (event) => {
  const body = await readBody<Record<string, unknown>>(event)

  if (!Array.isArray(body.comments)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Comments payload is required',
    })
  }

  return {
    comments: await updateAdminFeatureSection('comments', body.comments),
  }
})
