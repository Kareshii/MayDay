import { deleteArticle } from '../../../utils/articleRepository'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Article id is required',
    })
  }

  await deleteArticle(id)

  return {
    ok: true,
  }
})
