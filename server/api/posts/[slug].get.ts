import { getPublicArticleBySlug } from '../../utils/articleRepository'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const query = getQuery(event)

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Article slug is required',
    })
  }

  return {
    article: await getPublicArticleBySlug(slug, query.preview === '1'),
  }
})
