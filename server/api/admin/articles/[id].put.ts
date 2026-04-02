import { updateArticle } from '../../../utils/articleRepository'
import type { ManagedArticlePayload } from '../../../../shared/types/articles'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Article id is required',
    })
  }

  const body = await readBody<ManagedArticlePayload>(event)

  return {
    article: await updateArticle(id, body),
  }
})
