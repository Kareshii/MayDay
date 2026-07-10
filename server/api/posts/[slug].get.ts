import { getPublicArticleBySlug } from '../../utils/articleRepository'
import { readApprovedArticleComments } from '../../utils/adminFeatureStore'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug', { decode: true })
  const query = getQuery(event)

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Article slug is required',
    })
  }

  const [article, comments] = await Promise.all([
    getPublicArticleBySlug(slug, query.preview === '1'),
    readApprovedArticleComments(slug),
  ])

  return { article, comments }
})
