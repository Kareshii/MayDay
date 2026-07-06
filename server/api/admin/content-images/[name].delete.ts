import { createError, getRouterParam } from 'h3'
import { deleteContentImage } from '../../../utils/contentImageStorage'

export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, 'name')

  if (!name) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Image name is required',
    })
  }

  await deleteContentImage(decodeURIComponent(name))

  return {
    ok: true,
  }
})
