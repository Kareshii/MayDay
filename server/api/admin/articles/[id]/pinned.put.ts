import { updateArticlePinned } from '../../../../utils/articleRepository'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Article id is required',
    })
  }

  const body = await readBody<{ pinned?: boolean }>(event)

  return {
    article: await updateArticlePinned(id, body.pinned === true),
  }
})
