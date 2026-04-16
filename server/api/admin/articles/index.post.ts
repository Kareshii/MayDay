import { createArticle } from '../../../utils/articleRepository'
import type { ManagedArticlePayload } from '~~/shared/types/articles'

export default defineEventHandler(async (event) => {
  const body = await readBody<ManagedArticlePayload>(event)
  const article = await createArticle(body)

  return {
    article,
  }
})
