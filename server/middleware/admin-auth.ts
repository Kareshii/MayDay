import { createError, defineEventHandler, getRequestURL, sendRedirect } from 'h3'
import { isAdminAuthConfigured, readAdminSession } from '../utils/adminAuth'

const PUBLIC_ADMIN_PATHS = new Set([
  '/admin/login',
  '/api/admin/login',
  '/api/admin/logout',
  '/api/admin/session',
])

function isProtectedAdminPage(pathname: string) {
  return pathname === '/admin' || pathname.startsWith('/admin/')
}

function isProtectedAdminApi(pathname: string) {
  return pathname === '/api/admin' || pathname.startsWith('/api/admin/')
}

export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  const pathname = url.pathname
  const protectAdminPage = isProtectedAdminPage(pathname)
  const protectAdminApi = isProtectedAdminApi(pathname)

  if ((!protectAdminPage && !protectAdminApi) || PUBLIC_ADMIN_PATHS.has(pathname)) {
    return
  }

  if (!isAdminAuthConfigured()) {
    if (protectAdminApi) {
      throw createError({
        statusCode: 503,
        statusMessage: 'Admin authentication is not configured. Set ADMIN_PASSWORD before using /api/admin.',
      })
    }

    return sendRedirect(event, '/admin/login?reason=not-configured', 302)
  }

  if (readAdminSession(event)) {
    return
  }

  if (protectAdminApi) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required',
    })
  }

  const redirectTarget = encodeURIComponent(`${pathname}${url.search}`)
  return sendRedirect(event, `/admin/login?redirect=${redirectTarget}`, 302)
})
