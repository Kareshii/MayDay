import { createHash } from 'node:crypto'
import { createError, getHeader, getQuery, getRouterParam, readBody, type H3Event } from 'h3'
import { readAdminSession } from '../../../utils/adminAuth'
import { recordPublicArticleView } from '../../../utils/articleRepository'

interface ArticleViewBody {
  visitorId?: string
}

const botUserAgentPattern = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|twitterbot|telegrambot|whatsapp|preview|monitor|uptime/i

function getClientIp(event: H3Event) {
  return getHeader(event, 'cf-connecting-ip')
    || getHeader(event, 'x-real-ip')
    || String(getHeader(event, 'x-forwarded-for') || '').split(',')[0]?.trim()
    || ''
}

function hashVisitor(input: string) {
  return createHash('sha256').update(input).digest('hex')
}

function getViewedOn() {
  return new Date().toISOString().slice(0, 10)
}

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug', { decode: true })
  const query = getQuery(event)

  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Article slug is required',
    })
  }

  if (query.preview === '1' || readAdminSession(event)) {
    return {
      counted: false,
      skipped: true,
      viewCount: null,
    }
  }

  const userAgent = getHeader(event, 'user-agent') || ''

  if (!userAgent || botUserAgentPattern.test(userAgent)) {
    return {
      counted: false,
      skipped: true,
      viewCount: null,
    }
  }

  const body = await readBody<Partial<ArticleViewBody>>(event).catch((): Partial<ArticleViewBody> => ({}))
  const visitorId = String(body?.visitorId || '').trim().slice(0, 128)
  const visitorHash = hashVisitor([
    visitorId,
    getClientIp(event),
    userAgent,
  ].join('|'))

  return await recordPublicArticleView(slug, visitorHash, getViewedOn())
})
