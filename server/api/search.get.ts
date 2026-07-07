import { getQuery } from 'h3'
import { isDatabaseConfigured } from '../database/client'
import { searchPublicArticles } from '../utils/articleRepository'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const keyword = String(query.q || '').trim().slice(0, 80)

  if (!isDatabaseConfigured()) {
    return {
      results: [],
    }
  }

  return {
    results: await searchPublicArticles(keyword),
  }
})
