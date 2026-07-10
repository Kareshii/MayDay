import { isDatabaseConfigured } from '../../../database/client'
import { listAdminArticles } from '../../../utils/articleRepository'

function getQueryString(value: unknown) {
  const item = Array.isArray(value) ? value[0] : value
  return typeof item === 'string' ? item : ''
}

function getPositiveInteger(value: unknown, fallback: number, maximum: number) {
  const parsed = Number.parseInt(getQueryString(value), 10)
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, maximum) : fallback
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = getPositiveInteger(query.page, 1, Number.MAX_SAFE_INTEGER)
  const pageSize = getPositiveInteger(query.page_size, 20, 100)
  const search = getQueryString(query.search).trim()
  const rawStatus = getQueryString(query.status)
  const status = rawStatus === 'published' || rawStatus === 'draft' ? rawStatus : 'all'

  if (!isDatabaseConfigured()) {
    return {
      configMissing: true,
      articles: [],
      total: 0,
      page: 1,
      page_size: pageSize,
    }
  }

  const result = await listAdminArticles({
    page,
    pageSize,
    search,
    status,
  })

  return {
    configMissing: false,
    articles: result.articles,
    total: result.total,
    page: result.page,
    page_size: result.pageSize,
  }
})
